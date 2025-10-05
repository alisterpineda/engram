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

    // Open the space
    const spaceManager = SpaceManager.getInstance();
    const spaceData = await spaceManager.openSpace(spacePath);

    const window = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: WORKSPACE_WINDOW_PRELOAD_WEBPACK_ENTRY,
        additionalArguments: [`--space-path=${spacePath}`],
      },
      title: `${spaceData.name} - Engram`,
    });

    window.loadURL(WORKSPACE_WINDOW_WEBPACK_ENTRY);

    // Open DevTools in development
    // if (process.env.NODE_ENV !== 'production') {
    //   window.webContents.openDevTools();
    // }

    // Handle window close
    window.on('closed', async () => {
      await spaceManager.closeSpace(spacePath);
      SpaceWindow.windows.delete(spacePath);
    });

    SpaceWindow.windows.set(spacePath, { window, path: spacePath });
    return window;
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
