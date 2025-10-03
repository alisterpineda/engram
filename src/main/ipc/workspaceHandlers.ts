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

  // Create entry (post or comment)
  ipcMain.handle('entry:create', async (event, body: string, parentId?: number | null) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const workspacePath = WorkspaceWindow.getWorkspacePath(window);
      if (!workspacePath) {
        throw new Error('Workspace path not found');
      }

      const entry = await workspaceManager.createEntry(workspacePath, body, parentId);

      return { success: true, data: entry };
    } catch (error) {
      console.error('Error creating entry:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // List top-level entries (posts)
  ipcMain.handle('entry:list-posts', async (event, offset = 0, limit = 20) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const workspacePath = WorkspaceWindow.getWorkspacePath(window);
      if (!workspacePath) {
        throw new Error('Workspace path not found');
      }

      const entries = await workspaceManager.getTopLevelEntries(workspacePath, offset, limit);

      return { success: true, data: entries };
    } catch (error) {
      console.error('Error listing posts:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Get entry by ID
  ipcMain.handle('entry:get-by-id', async (event, id: number) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const workspacePath = WorkspaceWindow.getWorkspacePath(window);
      if (!workspacePath) {
        throw new Error('Workspace path not found');
      }

      const entry = await workspaceManager.getEntryById(workspacePath, id);

      if (!entry) {
        return { success: false, error: 'Entry not found' };
      }

      return { success: true, data: entry };
    } catch (error) {
      console.error('Error getting entry by ID:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // List comments for a post
  ipcMain.handle('entry:list-comments', async (event, parentId: number, offset?: number, limit?: number) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const workspacePath = WorkspaceWindow.getWorkspacePath(window);
      if (!workspacePath) {
        throw new Error('Workspace path not found');
      }

      const entries = await workspaceManager.getChildEntries(workspacePath, parentId, offset, limit);

      return { success: true, data: entries };
    } catch (error) {
      console.error('Error listing comments:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Update entry
  ipcMain.handle('entry:update', async (event, id: number, body: string) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const workspacePath = WorkspaceWindow.getWorkspacePath(window);
      if (!workspacePath) {
        throw new Error('Workspace path not found');
      }

      const entry = await workspaceManager.updateEntry(workspacePath, id, body);

      return { success: true, data: entry };
    } catch (error) {
      console.error('Error updating entry:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Delete entry
  ipcMain.handle('entry:delete', async (event, id: number) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const workspacePath = WorkspaceWindow.getWorkspacePath(window);
      if (!workspacePath) {
        throw new Error('Workspace path not found');
      }

      await workspaceManager.deleteEntry(workspacePath, id);

      return { success: true };
    } catch (error) {
      console.error('Error deleting entry:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}
