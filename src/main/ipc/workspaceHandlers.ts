import { ipcMain, BrowserWindow } from 'electron';
import { WorkspaceManager } from '../workspace/WorkspaceManager';
import { AppState } from '../state/AppState';
import { LauncherWindow } from '../windows/LauncherWindow';
import { WorkspaceWindow } from '../windows/WorkspaceWindow';

export function registerWorkspaceHandlers(): void {
  const workspaceManager = WorkspaceManager.getInstance();
  const appState = AppState.getInstance();

  // Get workspace info for the current window
  ipcMain.handle('get-workspace-info', async (event) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const workspacePath = WorkspaceWindow.getWorkspacePath(window);
      if (!workspacePath) {
        throw new Error('Workspace path not found');
      }

      const name = await workspaceManager.getWorkspaceName(workspacePath);

      return {
        success: true,
        data: {
          name,
          path: workspacePath,
        },
      };
    } catch (error) {
      console.error('Error getting workspace info:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Rename workspace
  ipcMain.handle('rename-workspace', async (event, newName: string) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const workspacePath = WorkspaceWindow.getWorkspacePath(window);
      if (!workspacePath) {
        throw new Error('Workspace path not found');
      }

      await workspaceManager.renameWorkspace(workspacePath, newName);

      // Update window title
      window.setTitle(`${newName} - Engram`);

      // Update recent workspaces
      appState.addRecentWorkspace({
        name: newName,
        path: workspacePath,
        lastOpened: Date.now(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error renaming workspace:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Open launcher from workspace window
  ipcMain.handle('open-launcher', () => {
    LauncherWindow.create();
    return { success: true };
  });

  // Get workspace setting
  ipcMain.handle('get-workspace-setting', async (event, key: string) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const workspacePath = WorkspaceWindow.getWorkspacePath(window);
      if (!workspacePath) {
        throw new Error('Workspace path not found');
      }

      const value = await workspaceManager.getSetting(workspacePath, key);

      return { success: true, value };
    } catch (error) {
      console.error('Error getting workspace setting:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Set workspace setting
  ipcMain.handle('set-workspace-setting', async (event, key: string, value: string) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const workspacePath = WorkspaceWindow.getWorkspacePath(window);
      if (!workspacePath) {
        throw new Error('Workspace path not found');
      }

      await workspaceManager.setSetting(workspacePath, key, value);

      return { success: true };
    } catch (error) {
      console.error('Error setting workspace setting:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}
