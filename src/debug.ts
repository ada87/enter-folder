import { window, workspace, env } from 'vscode';
import { get, set, clear } from './state';
import { restore } from './filesystem';
import { update, forceUpdate } from './context';

import type { ExtensionContext } from 'vscode';

export const reset = async (): Promise<void> => {
    try {
        // Restore original files.exclude if we have navigation state
        const currentState = get();
        if (currentState) {
            await restore(currentState.originalExcludes);
        }

        // Clear navigation state from workspace state
        await clear();

        // Reset plugin state
        update(false);

        window.showInformationMessage('Workspace has been reset, all cache cleared!');
    } catch (error) {
        window.showErrorMessage(`Failed to reset workspace: ${error}`);
    }
};

export const status = async (extensionContext: ExtensionContext): Promise<void> => {
    const savedState = extensionContext.workspaceState.get('folderNavigator.navigationState');
    const config = workspace.getConfiguration();
    const currentExcludes = config.get('files.exclude') as { [key: string]: boolean } || {};
    const currentState = get();

    const debugInfo = `Debug Information:
- Navigation state in memory: ${currentState ? 'exists' : 'not exists'}
- Saved navigation state: ${savedState ? 'exists' : 'not exists'}
- Current exclude settings: ${Object.keys(currentExcludes).length} items
- Context should be: ${currentState !== null ? 'true' : 'false'}

Detailed Information:
- Memory state: ${JSON.stringify(currentState, null, 2)}
- Saved state: ${JSON.stringify(savedState, null, 2)}
- Exclude settings: ${JSON.stringify(currentExcludes, null, 2)}`;

    window.showInformationMessage('Debug info copied to clipboard', 'Force Update Context').then(async (selection) => {
        if (selection === 'Force Update Context') {
            // Force restore state and update context
            if (savedState) {
                set(savedState as any);
                forceUpdate(true);
                window.showInformationMessage('Context forcefully updated, please check if back button appears');
            } else {
                window.showWarningMessage('No saved navigation state to restore');
            }
        }
    });

    // Copy debug info to clipboard
    await env.clipboard.writeText(debugInfo);
};