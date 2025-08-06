import { workspace, Uri, FileType, env, commands, window } from 'vscode';
import { relative, join, sep, isAbsolute } from 'path';
import { ENTER_STATE } from './state'


const getExecludes = async (targetPath: string): Promise<Record<string, boolean> | false> => {
    const relativePath = relative(ENTER_STATE.root, targetPath);
    if (relativePath.startsWith('..')) {
        //         // window.showErrorMessage('Can only enter folders within the current workspace');
        return false;
    }
    const newExcludes: Record<string, boolean> = {};

    // window.showInformationMessage(targetRelativePath)
    // Get all items under workspace root directory
    const rootUri = Uri.file(ENTER_STATE.root);
    const entries = await workspace.fs.readDirectory(rootUri);

    // const targetRelativePath = isAbsolute(targetPath)?relative()

    const firstLevelFolder = relativePath.split(sep)[0];
    for (const [name] of entries) {
        if (name !== firstLevelFolder) {
            newExcludes[name] = true;
            console.log('Excluding:', name);
        }
    }

    // If target path has multiple levels, recursively process subfolders
    if (relativePath.includes(sep)) {
        const pathParts = relativePath.split(sep);
        let currentPath = '';

        for (let i = 0; i < pathParts.length - 1; i++) {
            currentPath = currentPath ? join(currentPath, pathParts[i]) : pathParts[i];
            // console.log('Processing path level:', currentPath);

            try {
                const currentUri = Uri.file(join(ENTER_STATE.root, currentPath));
                const currentEntries = await workspace.fs.readDirectory(currentUri);
                const nextPart = pathParts[i + 1];

                for (const [subName] of currentEntries) {
                    if (subName !== nextPart) {
                        const subPath = join(currentPath, subName);
                        newExcludes[subPath] = true;
                        // console.log('Excluding sub-path:', subPath);
                    }
                }
            } catch (error) {
                // console.log('Error reading directory:', currentPath, error);
            }
        }
    }

    // console.log('Final excludes:', newExcludes);
    return newExcludes;
};

const getUri = async (uri?: Uri): Promise<Uri | null> => {
    if (uri) return uri;
    try {
        // Save current clipboard content
        const originalClipboard = await env.clipboard.readText();

        // Execute copy path command
        await commands.executeCommand('copyFilePath');

        // Get copied path
        const selectedPath = await env.clipboard.readText();

        // Restore original clipboard content
        await env.clipboard.writeText(originalClipboard);

        // Check if path is valid and different from original clipboard content
        if (selectedPath && selectedPath !== originalClipboard) {
            const uri = Uri.file(selectedPath);

            try {
                const stat = await workspace.fs.stat(uri);
                if (stat.type === FileType.Directory) {
                    return uri;
                }
            } catch (error) {
                console.log('Error checking file type:', error);
            }
        }

        return null;
    } catch (error) {
        console.log('Failed to get selected folder:', error);
        return null;
    }



}

export const enterFolder = async (uri?: Uri): Promise<void> => {
    const selectedUri = await getUri(uri);
    if (selectedUri == null) return;
    const folderPath = selectedUri.fsPath;
    const stat = await workspace.fs.stat(selectedUri);

    if (stat.type !== FileType.Directory) {
        // window.showErrorMessage('Please select a folder');
        return;
    }

    const excludes = await getExecludes(folderPath);
    if (excludes != false) {
        ENTER_STATE.enter(folderPath, excludes);
    }
};

export const backToParent = async (): Promise<void> => {
    const crumbs = ENTER_STATE.getCrumbs();
    if (crumbs.length === 0) return;
    if (crumbs.length === 1) {
        ENTER_STATE.backRoot();
        return;
    }

    const execludes = await getExecludes(crumbs[crumbs.length - 2])
    if (execludes != false) {
        ENTER_STATE.backParent(execludes);
    }
};

export const backToRoot = async (): Promise<void> => {
    if (ENTER_STATE.getCrumbs().length === 0) return;
    ENTER_STATE.backRoot();
}