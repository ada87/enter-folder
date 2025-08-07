import { workspace, commands, ConfigurationTarget } from 'vscode';

const EXTENSION_KEY = 'enterFolder';
const CORE_KEY = 'files.exclude';

var WORKSPACE_ROOT: string;

type InnerEnterFolderState = {
    root: string;
    crumbs: Array<string>;
    excludes: Record<string, boolean>;
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

const initState = () => {
    const SETTING = workspace.getConfiguration();
    let initValue: InnerEnterFolderState = SETTING.get(EXTENSION_KEY) as InnerEnterFolderState;
    if (initValue == null || initValue.root == null) {
        initValue = {
            root: WORKSPACE_ROOT,
            crumbs: [],
            tip: 'EnterFolder will update "file.executes" in "setting.json", If you uninstall or disable this extension, you will use the excludes below replace file.executes to restore the original state.',
            excludes: SETTING.get<Record<string, boolean>>(CORE_KEY) || {},
        }
        SETTING.update(EXTENSION_KEY, initValue, ConfigurationTarget.Workspace);
    } else if (initValue.crumbs.length > 0) {
        //         window.showInformationMessage(`Tips
        // Current is in a sub-folder, 
        // you can use "Ctrl + Shift + BackSpace" 
        // to return to the root folder`);
        setIsInSubFolder(true);
    }
    const DATA = { ...initValue };
    ENTER_STATE.root = DATA.root;
    ENTER_STATE.getCrumbs = () => DATA.crumbs;
    ENTER_STATE.enter = (path: string, executes: Record<string, boolean>) => {
        if (path === DATA.root) return;
        if (DATA.crumbs.length == 0) {
            const originalExecutes = SETTING.get<Record<string, boolean>>(CORE_KEY) || {};
            DATA.excludes = originalExecutes;
        }
        DATA.crumbs.push(path);
        setIsInSubFolder(true);
        SETTING.update(CORE_KEY, executes, ConfigurationTarget.Workspace);
        SETTING.update(EXTENSION_KEY, DATA, ConfigurationTarget.Workspace);
    };
    ENTER_STATE.backParent = (executes: Record<string, boolean>) => {
        DATA.crumbs.pop();
        setIsInSubFolder(true);
        SETTING.update(CORE_KEY, executes, ConfigurationTarget.Workspace);
        SETTING.update(EXTENSION_KEY, DATA, ConfigurationTarget.Workspace);
    };
    ENTER_STATE.backRoot = () => {
        DATA.crumbs = [];
        setIsInSubFolder(false);
        SETTING.update(CORE_KEY, DATA.excludes, ConfigurationTarget.Workspace);
        SETTING.update(EXTENSION_KEY, { ...initValue, crumbs: [] }, ConfigurationTarget.Workspace);
    };
}

export const init = (): boolean => {
    if (workspace.workspaceFolders == null || workspace.workspaceFolders.length === 0) return false;
    WORKSPACE_ROOT = workspace.workspaceFolders[0].uri.fsPath;
    initState()
    return true;
};

