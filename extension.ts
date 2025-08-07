import { commands } from 'vscode';
import { init } from './state';
import { enterFolder, backToParent, backToRoot } from './command';

import type { ExtensionContext, Uri } from 'vscode';
export const activate = (context: ExtensionContext) => {
    if (init()) {
        context.subscriptions.push(
            commands.registerCommand('enterFolder.enterFolder', async (uri: Uri) => {
                await enterFolder(uri);
            }),
            commands.registerCommand('enterFolder.backToParent', async () => {
                await backToParent();
            }),
            commands.registerCommand('enterFolder.backToRoot', async () => {
                await backToRoot();
            })
        );
    }
};