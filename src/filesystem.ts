import { workspace, Uri, ConfigurationTarget } from 'vscode';
import { join, sep } from 'path';

export const updateView = async (workspaceRoot: string, targetRelativePath: string): Promise<void> => {
    console.log('updateExplorerView called with:', { workspaceRoot, targetRelativePath });

    const config = workspace.getConfiguration();
    const newExcludes: { [key: string]: boolean } = {};

    // If target path is empty (root directory), no need to exclude anything
    if (!targetRelativePath || targetRelativePath === '.') {
        console.log('Target is root directory, not excluding anything');
        await config.update('files.exclude', {}, ConfigurationTarget.Workspace);
        return;
    }

    // Get all items under workspace root directory
    const rootUri = Uri.file(workspaceRoot);
    const entries = await workspace.fs.readDirectory(rootUri);

    console.log('Root entries:', entries.map(([name]) => name));

    // Get first level folder of target path
    const firstLevelFolder = targetRelativePath.split(sep)[0];
    console.log('First level folder:', firstLevelFolder);

    // Exclude all folders that are not first level of target path
    for (const [name] of entries) {
        if (name !== firstLevelFolder) {
            newExcludes[name] = true;
            console.log('Excluding:', name);
        }
    }

    // If target path has multiple levels, recursively process subfolders
    if (targetRelativePath.includes(sep)) {
        const pathParts = targetRelativePath.split(sep);
        let currentPath = '';

        for (let i = 0; i < pathParts.length - 1; i++) {
            currentPath = currentPath ? join(currentPath, pathParts[i]) : pathParts[i];
            console.log('Processing path level:', currentPath);

            try {
                const currentUri = Uri.file(join(workspaceRoot, currentPath));
                const currentEntries = await workspace.fs.readDirectory(currentUri);
                const nextPart = pathParts[i + 1];

                for (const [subName] of currentEntries) {
                    if (subName !== nextPart) {
                        const subPath = join(currentPath, subName);
                        newExcludes[subPath] = true;
                        console.log('Excluding sub-path:', subPath);
                    }
                }
            } catch (error) {
                console.log('Error reading directory:', currentPath, error);
            }
        }
    }

    console.log('Final excludes:', newExcludes);
    await config.update('files.exclude', newExcludes, ConfigurationTarget.Workspace);
};

export const restore = async (originalExcludes: { [key: string]: boolean }): Promise<void> => {
    const config = workspace.getConfiguration();
    await config.update('files.exclude', originalExcludes, ConfigurationTarget.Workspace);
};