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

  // Create entry
  ipcMain.handle('entry:create', async (event, contentJson: string, referenceIds?: number[], startedAt?: string, endedAt?: string | null, title?: string | null) => {
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

      const entry = await spaceManager.createEntry(spacePath, contentJson, referenceIds, startedAtDate, endedAtDate, title);

      return { success: true, data: entry };
    } catch (error) {
      console.error('Error creating entry:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // List all entries
  ipcMain.handle('entry:list-all', async (event, offset = 0, limit = 20) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      const entries = await spaceManager.getAllEntries(spacePath, offset, limit);

      return { success: true, data: entries };
    } catch (error) {
      console.error('Error listing entries:', error);
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

  // Get referenced notes
  ipcMain.handle('entry:get-referenced-notes', async (event, id: number) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      const entries = await spaceManager.getReferencedNotes(spacePath, id);

      return { success: true, data: entries };
    } catch (error) {
      console.error('Error getting referenced notes:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Add reference
  ipcMain.handle('entry:add-reference', async (event, sourceId: number, targetId: number) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      await spaceManager.addReference(spacePath, sourceId, targetId);

      return { success: true };
    } catch (error) {
      console.error('Error adding reference:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Remove reference
  ipcMain.handle('entry:remove-reference', async (event, sourceId: number, targetId: number) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      await spaceManager.removeReference(spacePath, sourceId, targetId);

      return { success: true };
    } catch (error) {
      console.error('Error removing reference:', error);
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

  // Page IPC handlers
  // Create page
  ipcMain.handle('page:create', async (event, contentJson: string, title: string, referenceIds?: number[]) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      const page = await spaceManager.createPage(spacePath, contentJson, title, referenceIds);

      return { success: true, data: page };
    } catch (error) {
      console.error('Error creating page:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // List all pages
  ipcMain.handle('page:list-all', async (event, offset = 0, limit = 20) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      const pages = await spaceManager.getAllPages(spacePath, offset, limit);

      return { success: true, data: pages };
    } catch (error) {
      console.error('Error listing pages:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Get page by ID
  ipcMain.handle('page:get-by-id', async (event, id: number) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      const page = await spaceManager.getPageById(spacePath, id);

      if (!page) {
        return { success: false, error: 'Page not found' };
      }

      return { success: true, data: page };
    } catch (error) {
      console.error('Error getting page by ID:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Update page
  ipcMain.handle('page:update', async (event, id: number, contentJson: string, title: string) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      const page = await spaceManager.updatePage(spacePath, id, contentJson, title);

      return { success: true, data: page };
    } catch (error) {
      console.error('Error updating page:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Delete page
  ipcMain.handle('page:delete', async (event, id: number) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      await spaceManager.deletePage(spacePath, id);

      return { success: true };
    } catch (error) {
      console.error('Error deleting page:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Contact IPC handlers
  // Create contact
  ipcMain.handle('contact:create', async (event, contentJson: string, title: string, referenceIds?: number[]) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      const contact = await spaceManager.createContact(spacePath, contentJson, title, referenceIds);

      return { success: true, data: contact };
    } catch (error) {
      console.error('Error creating contact:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // List all contacts
  ipcMain.handle('contact:list-all', async (event, offset = 0, limit = 20) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      const contacts = await spaceManager.getAllContacts(spacePath, offset, limit);

      return { success: true, data: contacts };
    } catch (error) {
      console.error('Error listing contacts:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Get contact by ID
  ipcMain.handle('contact:get-by-id', async (event, id: number) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      const contact = await spaceManager.getContactById(spacePath, id);

      if (!contact) {
        return { success: false, error: 'Contact not found' };
      }

      return { success: true, data: contact };
    } catch (error) {
      console.error('Error getting contact by ID:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Update contact
  ipcMain.handle('contact:update', async (event, id: number, contentJson: string, title: string) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      const contact = await spaceManager.updateContact(spacePath, id, contentJson, title);

      return { success: true, data: contact };
    } catch (error) {
      console.error('Error updating contact:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Delete contact
  ipcMain.handle('contact:delete', async (event, id: number) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      const spacePath = SpaceWindow.getSpacePath(window);
      if (!spacePath) {
        throw new Error('Space path not found');
      }

      await spaceManager.deleteContact(spacePath, id);

      return { success: true };
    } catch (error) {
      console.error('Error deleting contact:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}
