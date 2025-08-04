import { window, workspace, Uri, FileType, env, commands } from 'vscode';
import { relative } from 'path';
import { get, set, save, clear } from './state';
import { updateView, restore } from './filesystem';
import { update } from './context';

export const enterFolder = async (uri?: Uri): Promise<void> => {
    try {
        // If no URI provided (keyboard shortcut), get selected folder
        if (!uri) {
            const selectedUri = await getSelectedFolder();
            if (!selectedUri) {
                return;
            }
            uri = selectedUri;
        }

        if (!uri.fsPath) {
            window.showErrorMessage('Please select a valid folder');
            return;
        }

        const folderPath = uri.fsPath;
        const stat = await workspace.fs.stat(uri);

        if (stat.type !== FileType.Directory) {
            window.showErrorMessage('Please select a folder');
            return;
        }

        const workspaceFolders = workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            window.showErrorMessage('No workspace is open');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const relativePath = relative(workspaceRoot, folderPath);

        if (relativePath.startsWith('..')) {
            window.showErrorMessage('Can only enter folders within the current workspace');
            return;
        }

        // Save current state
        let currentState = get();
        if (!currentState) {
            const config = workspace.getConfiguration();
            const currentExcludes = config.get('files.exclude') as { [key: string]: boolean } || {};

            currentState = {
                originalRoot: workspaceRoot,
                currentRoot: folderPath,
                navigationStack: [workspaceRoot],
                originalExcludes: { ...currentExcludes }
            };
        } else {
            currentState.navigationStack.push(currentState.currentRoot);
            currentState.currentRoot = folderPath;
        }

        set(currentState);

        // Create new exclusion rules to show only target folder
        await updateView(workspaceRoot, relativePath);

        // Save navigation state to workspace state (after successful view update)
        await save();

        update(true);
    } catch (error) {
        window.showErrorMessage(`Failed to enter folder: ${error}`);
    }
};

export const backToRoot = async (): Promise<void> => {
    const currentState = get();
    if (!currentState) {
        return;
    }

    try {
        const workspaceRoot = currentState.originalRoot;

        if (currentState.navigationStack.length > 1) {
            // Return to parent level
            const targetPath = currentState.navigationStack.pop()!;
            currentState.currentRoot = targetPath;

            const relativePath = relative(workspaceRoot, targetPath);
            await updateView(workspaceRoot, relativePath);
        } else {
            // Return to original root directory
            await restore(currentState.originalExcludes);
            set(null);
            await clear();
        }

        // Save state changes
        await save();
        update(get() !== null);
    } catch (error) {
        console.log('Failed to go back:', error);
    }
};

const getSelectedFolder = async (): Promise<Uri | null> => {
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
};