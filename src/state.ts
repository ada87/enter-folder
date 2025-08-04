import { workspace, Uri, FileType } from 'vscode';
import type { ExtensionContext } from 'vscode';
import type { NavigationState } from './types';

let navigationState: NavigationState | null = null;
let extensionContext: ExtensionContext;

export const initialize = (context: ExtensionContext): void => {
    extensionContext = context;
};

export const get = (): NavigationState | null => {
    return navigationState;
};

export const set = (state: NavigationState | null): void => {
    navigationState = state;
};

export const save = async (): Promise<void> => {
    if (!navigationState || !extensionContext) return;

    // Save to workspace state instead of settings.json
    await extensionContext.workspaceState.update('enterFolder.navigationState', navigationState);
    console.log('Navigation state saved to workspace state:', navigationState);
};

export const clear = async (): Promise<void> => {
    if (!extensionContext) return;
    
    // Clear from workspace state
    await extensionContext.workspaceState.update('enterFolder.navigationState', undefined);
    console.log('Navigation state cleared from workspace state');
    navigationState = null;
};

export const load = async (): Promise<void> => {
    if (!extensionContext) return;
    
    const savedState = extensionContext.workspaceState.get('enterFolder.navigationState') as NavigationState | undefined;

    if (savedState) {
        // Verify the saved paths still exist
        try {
            const stat = await workspace.fs.stat(Uri.file(savedState.currentRoot));
            if (stat.type === FileType.Directory) {
                navigationState = savedState;
                console.log('Navigation state restored from workspace state:', navigationState);
            } else {
                console.log('Saved navigation path no longer exists, clearing state');
                await clear();
            }
        } catch (error) {
            console.log('Error verifying saved navigation path, clearing state:', error);
            await clear();
        }
    }
};