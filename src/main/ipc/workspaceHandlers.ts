import { ipcMain, BrowserWindow } from 'electron';
import { SpaceManager } from '../space/SpaceManager';
import { AppState } from '../state/AppState';
import { LauncherWindow } from '../windows/LauncherWindow';
import { SpaceWindow } from '../windows/SpaceWindow';

export function registerWorkspaceHandlers(): void {
  const spaceManager = SpaceManager.getInstance();
  const appState = AppState.getInstance();

  // Get space info for the current window
  ipcMain.handle('get-space-info', async (event) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      const name = await spaceManager.getSpaceName(spacePath);

      return {
        success: true,
        data: {
          name,
          path: spacePath,
        },
      };
    } catch (error) {
      console.error('Error getting space info:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Open launcher from space window
  ipcMain.handle('open-launcher', () => {
    LauncherWindow.create();
    return { success: true };
  });

  // Get space setting
  ipcMain.handle('get-space-setting', async (event, key: string) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      const value = await spaceManager.getSetting(spacePath, key);

      return { success: true, value };
    } catch (error) {
      console.error('Error getting space setting:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Set space setting
  ipcMain.handle('set-space-setting', async (event, key: string, value: string) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      await spaceManager.setSetting(spacePath, key, value);

      return { success: true };
    } catch (error) {
      console.error('Error setting space setting:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Create entry (post or comment)
  ipcMain.handle('entry:create', async (event, contentJson: string, parentId?: number | null, startedAt?: string, endedAt?: string | null, title?: string | null) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      // Parse date strings to Date objects
      const startedAtDate = startedAt ? new Date(startedAt) : undefined;
      const endedAtDate = endedAt ? new Date(endedAt) : undefined;

      const entry = await spaceManager.createEntry(spacePath, contentJson, parentId, startedAtDate, endedAtDate, title);

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

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      const entries = await spaceManager.getTopLevelEntries(spacePath, offset, limit);

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

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      const entry = await spaceManager.getEntryById(spacePath, id);

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

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      const entries = await spaceManager.getChildEntries(spacePath, parentId, offset, limit);

      return { success: true, data: entries };
    } catch (error) {
      console.error('Error listing comments:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Update entry
  ipcMain.handle('entry:update', async (event, id: number, contentJson: string, startedAt?: string, endedAt?: string | null, title?: string | null) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      // Parse date strings to Date objects
      const startedAtDate = startedAt ? new Date(startedAt) : undefined;
      const endedAtDate = endedAt !== undefined ? (endedAt ? new Date(endedAt) : null) : undefined;

      const entry = await spaceManager.updateEntry(spacePath, id, contentJson, startedAtDate, endedAtDate, title);

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

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      await spaceManager.deleteEntry(spacePath, id);

      return { success: true };
    } catch (error) {
      console.error('Error deleting entry:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}
