import { ipcMain, dialog, app } from 'electron';
import * as path from 'path';
import * as os from 'os';
import { WorkspaceManager } from '../workspace/WorkspaceManager';
import { AppState } from '../state/AppState';
import { LauncherWindow } from '../windows/LauncherWindow';
import { WorkspaceWindow } from '../windows/WorkspaceWindow';

export function registerLauncherHandlers(): void {
  const workspaceManager = WorkspaceManager.getInstance();
  const appState = AppState.getInstance();

  // Create new workspace
  ipcMain.handle('create-workspace', async (_event, name: string, filePath: string) => {
    try {
      const workspaceData = await workspaceManager.createWorkspace(name, filePath);

      // Add to recent workspaces
      appState.addRecentWorkspace({
        name,
        path: filePath,
        lastOpened: Date.now(),
      });

      // Set as last opened
      appState.setLastOpened(filePath);

      // Close launcher window
      LauncherWindow.close();

      // Open workspace window
      await WorkspaceWindow.create(filePath);

      return { success: true, workspace: workspaceData };
    } catch (error) {
      console.error('Error creating workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Open existing workspace
  ipcMain.handle('open-workspace', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Open Workspace',
        properties: ['openFile'],
        filters: [
          { name: 'Engram Workspace', extensions: ['sqlite'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const filePath = result.filePaths[0];

      // Open the workspace
      const workspaceData = await workspaceManager.openWorkspace(filePath);

      // Add to recent workspaces
      appState.addRecentWorkspace({
        name: workspaceData.name,
        path: filePath,
        lastOpened: Date.now(),
      });

      // Set as last opened
      appState.setLastOpened(filePath);

      // Close launcher window
      LauncherWindow.close();

      // Open workspace window
      await WorkspaceWindow.create(filePath);

      return { success: true, workspace: workspaceData };
    } catch (error) {
      console.error('Error opening workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Get recent workspaces
  ipcMain.handle('get-recent-workspaces', () => {
    return appState.getRecentWorkspaces();
  });

  // Select workspace save location
  ipcMain.handle('select-workspace-path', async (_event, name: string) => {
    try {
      // Sanitize the workspace name for use as filename
      const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const defaultPath = path.join(
        os.homedir(),
        'Documents',
        'Engram',
        `${sanitizedName}.sqlite`
      );

      const result = await dialog.showSaveDialog({
        title: 'Create Workspace',
        defaultPath,
        filters: [
          { name: 'Engram Workspace', extensions: ['sqlite'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      return { success: true, path: result.filePath };
    } catch (error) {
      console.error('Error selecting workspace path:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Open workspace by path (for recent workspaces)
  ipcMain.handle('open-workspace-by-path', async (_event, filePath: string) => {
    try {
      // Open the workspace
      const workspaceData = await workspaceManager.openWorkspace(filePath);

      // Add to recent workspaces
      appState.addRecentWorkspace({
        name: workspaceData.name,
        path: filePath,
        lastOpened: Date.now(),
      });

      // Set as last opened
      appState.setLastOpened(filePath);

      // Close launcher window
      LauncherWindow.close();

      // Open workspace window
      await WorkspaceWindow.create(filePath);

      return { success: true, workspace: workspaceData };
    } catch (error) {
      console.error('Error opening workspace by path:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}
