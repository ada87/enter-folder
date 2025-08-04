import { commands } from 'vscode';
import { initialize, load, get } from './state';
import { update, forceUpdate } from './context';
import { enterFolder, backToRoot } from './commands';
import { reset } from './debug';
import { restore } from './filesystem';

import type { ExtensionContext, Uri } from 'vscode';

let extensionContext: ExtensionContext;

export const activate = (context: ExtensionContext) => {
    // console.log('Folder Navigator is now active!');

    // Store context for later use
    extensionContext = context;

    // Initialize state manager
    initialize(context);

    // Initialize extension
    initializeExtension();

    // Register commands
    registerCommands(context);

    // Update context
    update(get() !== null);
};

const initializeExtension = async (): Promise<void> => {
    // Load saved state
    await load();

    // Force update context if state exists
    const currentState = get();
    if (currentState) {
        forceUpdate(true);
    }

    // Update context at different time points to ensure correct setting in various situations
    setTimeout(() => update(get() !== null), 500);
    setTimeout(() => update(get() !== null), 2000);
    setTimeout(() => update(get() !== null), 5000);
};

const registerCommands = (context: ExtensionContext): void => {
    // Register enter folder command
    const enterFolderCommand = commands.registerCommand('enterFolder.enterFolder', async (uri?: Uri) => {
        await enterFolder(uri);
    });

    // Register back to parent command
    const backToParentCommand = commands.registerCommand('enterFolder.backToParent', async () => {
        await backToRoot();
    });

    // Register back to root command (reset workspace)
    const backToRootCommand = commands.registerCommand('enterFolder.backToRoot', async () => {
        await reset();
    });

    context.subscriptions.push(
        enterFolderCommand,
        backToParentCommand,
        backToRootCommand
    );
};

export const deactivate = (): void => {
    // Clean up on deactivation
    const currentState = get();
    if (currentState) {
        // Restore original files.exclude settings
        restore(currentState.originalExcludes)
            .then(() => {
                console.log('Original files.exclude settings restored on deactivation');
            }, (error: any) => {
                console.log('Error restoring files.exclude on deactivation:', error);
            });
    }
};