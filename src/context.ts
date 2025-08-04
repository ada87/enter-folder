import { commands } from 'vscode';

export const update = (inSubFolder: boolean): void => {
    console.log('Setting context enterFolder.inSubFolder to:', inSubFolder);

    // Use Promise to ensure command execution completion
    commands.executeCommand('setContext', 'enterFolder.inSubFolder', inSubFolder).then(() => {
        console.log('Context updated successfully');
    }, (error: any) => {
        console.log('Error updating context:', error);
    });
};

export const forceUpdate = (inSubFolder: boolean): void => {
    console.log('Force updating context enterFolder.inSubFolder to:', inSubFolder);

    // Set context immediately
    commands.executeCommand('setContext', 'enterFolder.inSubFolder', inSubFolder);

    // Multiple delayed updates to ensure effectiveness at various loading stages
    setTimeout(() => {
        commands.executeCommand('setContext', 'enterFolder.inSubFolder', inSubFolder);
        console.log('Context force updated at 100ms');
    }, 100);

    setTimeout(() => {
        commands.executeCommand('setContext', 'enterFolder.inSubFolder', inSubFolder);
        console.log('Context force updated at 500ms');
    }, 500);

    setTimeout(() => {
        commands.executeCommand('setContext', 'enterFolder.inSubFolder', inSubFolder);
        console.log('Context force updated at 1000ms');
    }, 1000);

    setTimeout(() => {
        commands.executeCommand('setContext', 'enterFolder.inSubFolder', inSubFolder);
        console.log('Context force updated at 2000ms');
    }, 2000);
};