import { ipcMain, dialog, app } from 'electron';
import * as path from 'path';
import * as os from 'os';
import { SpaceManager } from '../space/SpaceManager';
import { AppState } from '../state/AppState';
import { LauncherWindow } from '../windows/LauncherWindow';
import { SpaceWindow } from '../windows/SpaceWindow';

export function registerLauncherHandlers(): void {
  const spaceManager = SpaceManager.getInstance();
  const appState = AppState.getInstance();

  // Create new space
  ipcMain.handle('create-space', async (_event, name: string, folderPath: string) => {
    try {
      const spaceData = await spaceManager.createSpace(name, folderPath);

      // Add to recent spaces
      appState.addRecentSpace({
        name,
        path: folderPath,
        lastOpened: Date.now(),
      });

      // Set as last opened
      appState.setLastOpened(folderPath);

      // Close launcher window
      LauncherWindow.close();

      // Open space window
      await SpaceWindow.create(folderPath);

      return { success: true, space: spaceData };
    } catch (error) {
      console.error('Error creating space:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Open existing space
  ipcMain.handle('open-space', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Open Space',
        properties: ['openDirectory'],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const folderPath = result.filePaths[0];

      // Open the space
      const spaceData = await spaceManager.openSpace(folderPath);

      // Add to recent spaces
      appState.addRecentSpace({
        name: spaceData.name,
        path: folderPath,
        lastOpened: Date.now(),
      });

      // Set as last opened
      appState.setLastOpened(folderPath);

      // Close launcher window
      LauncherWindow.close();

      // Open space window
      await SpaceWindow.create(folderPath);

      return { success: true, space: spaceData };
    } catch (error) {
      console.error('Error opening space:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Get recent spaces
  ipcMain.handle('get-recent-spaces', () => {
    return appState.getRecentSpaces();
  });

  // Select space folder location
  ipcMain.handle('select-space-path', async (_event, name: string) => {
    try {
      // Sanitize the space name for use as folder name
      const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const defaultPath = path.join(
        os.homedir(),
        'Documents',
        'Engram',
        sanitizedName
      );

      const result = await dialog.showOpenDialog({
        title: 'Select Space Location',
        defaultPath: path.join(os.homedir(), 'Documents', 'Engram'),
        properties: ['openDirectory', 'createDirectory'],
        buttonLabel: 'Select Folder',
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      // Use the selected folder path with the sanitized name
      const selectedFolder = result.filePaths[0];
      const finalPath = path.join(selectedFolder, sanitizedName);

      return { success: true, path: finalPath };
    } catch (error) {
      console.error('Error selecting space path:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Open space by path (for recent spaces)
  ipcMain.handle('open-space-by-path', async (_event, folderPath: string) => {
    try {
      // Open the space
      const spaceData = await spaceManager.openSpace(folderPath);

      // Add to recent spaces
      appState.addRecentSpace({
        name: spaceData.name,
        path: folderPath,
        lastOpened: Date.now(),
      });

      // Set as last opened
      appState.setLastOpened(folderPath);

      // Close launcher window
      LauncherWindow.close();

      // Open space window
      await SpaceWindow.create(folderPath);

      return { success: true, space: spaceData };
    } catch (error) {
      console.error('Error opening space by path:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}
