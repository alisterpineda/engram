import { BrowserWindow } from 'electron';
import { SpaceManager } from '../space/SpaceManager';

// Magic constants from Webpack
declare const WORKSPACE_WINDOW_WEBPACK_ENTRY: string;
declare const WORKSPACE_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

interface SpaceWindowInfo {
  window: BrowserWindow;
  path: string;
}

export class SpaceWindow {
  private static windows: Map<string, SpaceWindowInfo> = new Map();

  public static async create(spacePath: string): Promise<BrowserWindow> {
    // Check if space is already open
    const existing = SpaceWindow.windows.get(spacePath);
    if (existing && !existing.window.isDestroyed()) {
      existing.window.focus();
      return existing.window;
    }

    const spaceManager = SpaceManager.getInstance();

    // Create the window first
    const window = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: WORKSPACE_WINDOW_PRELOAD_WEBPACK_ENTRY,
        additionalArguments: [`--space-path=${spacePath}`],
      },
      title: 'Loading Space... - Engram',
    });

    // Start loading the page
    window.loadURL(WORKSPACE_WINDOW_WEBPACK_ENTRY);

    // Open DevTools in development
    // if (process.env.NODE_ENV !== 'production') {
    //   window.webContents.openDevTools();
    // }

    try {
      // Wait for the page to be ready before sending migration events
      await new Promise<void>((resolve) => {
        if (window.webContents.isLoading()) {
          window.webContents.once('did-finish-load', () => resolve());
        } else {
          resolve();
        }
      });

      // Send migration start event
      window.webContents.send('migration:start');

      // Open the space with migration progress callback
      const spaceData = await spaceManager.openSpace(spacePath, (current, total) => {
        window.webContents.send('migration:progress', { current, total });
      });

      // Send migration complete event
      window.webContents.send('migration:complete');

      // Update window title with space name
      window.setTitle(`${spaceData.name} - Engram`);

      // Handle window close
      window.on('closed', async () => {
        await spaceManager.closeSpace(spacePath);
        SpaceWindow.windows.delete(spacePath);
      });

      SpaceWindow.windows.set(spacePath, { window, path: spacePath });
      return window;
    } catch (error) {
      // Send error event to window
      window.webContents.send('migration:error', {
        message: (error as Error).message,
      });

      // Close window after a short delay to allow error to be displayed
      setTimeout(() => {
        if (!window.isDestroyed()) {
          window.close();
        }
      }, 100);

      throw error;
    }
  }

  public static getWindow(spacePath: string): BrowserWindow | undefined {
    const info = SpaceWindow.windows.get(spacePath);
    return info?.window;
  }

  public static getAllWindows(): BrowserWindow[] {
    return Array.from(SpaceWindow.windows.values())
      .map((info) => info.window)
      .filter((win) => !win.isDestroyed());
  }

  public static getSpacePath(window: BrowserWindow): string | undefined {
    for (const [path, info] of SpaceWindow.windows.entries()) {
      if (info.window === window) {
        return path;
      }
    }
    return undefined;
  }
}
