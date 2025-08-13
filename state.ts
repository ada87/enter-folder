import { workspace, commands, ConfigurationTarget } from 'vscode';
import type { WorkspaceConfiguration } from 'vscode';
const EXTENSION_KEY = 'enterFolder';
const EXCLUDE_KEY = 'files.exclude';

var WORKSPACE_ROOT: string;

type InnerEnterFolderState = {
    root: string;
    crumbs: Array<string>;
    excludes: Record<string, boolean> | undefined;
    tip: string;
}

type EnterFolderState = {
    root: string;
    getCrumbs: () => ArrayLike<string>;
    enter: (path: string, executes: Record<string, boolean>) => void;
    backParent: (executes: Record<string, boolean>) => void;
    backRoot: () => void;
}
const setIsInSubFolder = (inSubFolder: boolean) => commands.executeCommand('setContext', 'enterFolder.inSubFolder', inSubFolder)
export const ENTER_STATE = {} as EnterFolderState;

const getFileExcludes = (config: WorkspaceConfiguration): Record<string, boolean> | undefined => {
    const inspection = config.inspect(EXCLUDE_KEY);
    return inspection?.workspaceFolderValue as any;
}

const initState = () => {
    const SETTING = workspace.getConfiguration();
    // const 
    let initValue: InnerEnterFolderState | undefined = SETTING.get(EXTENSION_KEY);


    if (initValue == null || initValue.root == null) {

        initValue = {
            root: WORKSPACE_ROOT,
            crumbs: [],
            tip: 'EnterFolder will update "file.executes" in "setting.json", If you uninstall or disable this extension, you will use the excludes below replace file.executes to restore the original state.',
            excludes: getFileExcludes(SETTING),
        }
    } else if (initValue.crumbs.length > 0) {
        // Current is in a sub-folder, 
        // you can use "Ctrl + Shift + BackSpace" 
        // to return to the root folder`);
        setIsInSubFolder(true);
    }
    const DATA = { ...initValue };
    ENTER_STATE.root = DATA.root;
    ENTER_STATE.getCrumbs = () => DATA.crumbs;
    ENTER_STATE.enter = async (path: string, executes: Record<string, boolean>) => {
        if (path === DATA.root) return;
        if (DATA.crumbs.length == 0) {
            DATA.excludes = getFileExcludes(SETTING);
        }
        DATA.crumbs.push(path);
        setIsInSubFolder(true);
        await SETTING.update(EXCLUDE_KEY, executes, ConfigurationTarget.Workspace);
        await SETTING.update(EXTENSION_KEY, DATA, ConfigurationTarget.Workspace);
    };
    ENTER_STATE.backParent = async (executes: Record<string, boolean>) => {
        DATA.crumbs.pop();
        setIsInSubFolder(true);
        await SETTING.update(EXCLUDE_KEY, executes, ConfigurationTarget.Workspace);
        await SETTING.update(EXTENSION_KEY, DATA, ConfigurationTarget.Workspace);
    };
    ENTER_STATE.backRoot = async () => {
        DATA.crumbs = [];
        setIsInSubFolder(false);
        await SETTING.update(EXCLUDE_KEY, DATA.excludes, ConfigurationTarget.Workspace);
        await SETTING.update(EXTENSION_KEY, undefined, ConfigurationTarget.Workspace);
    };
}

export const init = (): boolean => {
    if (workspace.workspaceFolders == null || workspace.workspaceFolders.length === 0) return false;
    WORKSPACE_ROOT = workspace.workspaceFolders[0].uri.fsPath;
    initState()
    return true;
};

