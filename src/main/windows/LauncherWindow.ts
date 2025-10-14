import { BrowserWindow, shell } from 'electron';

// Magic constants from Webpack
declare const LAUNCHER_WINDOW_WEBPACK_ENTRY: string;
declare const LAUNCHER_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

export class LauncherWindow {
  private static instance: BrowserWindow | null = null;

  public static create(): BrowserWindow {
    if (LauncherWindow.instance && !LauncherWindow.instance.isDestroyed()) {
      LauncherWindow.instance.focus();
      return LauncherWindow.instance;
    }

    const window = new BrowserWindow({
      width: 900,
      height: 600,
      resizable: true,
      webPreferences: {
        preload: LAUNCHER_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
      title: 'Engram Launcher',
    });

    window.loadURL(LAUNCHER_WINDOW_WEBPACK_ENTRY);

    // Handle external links - open in system browser
    window.webContents.setWindowOpenHandler(({ url }) => {
      // Allow only internal app URLs, open everything else externally
      if (!url.startsWith(LAUNCHER_WINDOW_WEBPACK_ENTRY)) {
        shell.openExternal(url);
      }
      return { action: 'deny' };
    });

    // Prevent navigation away from app
    window.webContents.on('will-navigate', (event, url) => {
      const currentUrl = window.webContents.getURL();
      if (url !== currentUrl) {
        event.preventDefault();
        // Open any external URL (http, https, mailto, tel, etc.)
        shell.openExternal(url);
      }
    });

    // Open DevTools in development
    // if (process.env.NODE_ENV !== 'production') {
    //   window.webContents.openDevTools();
    // }

    window.on('closed', () => {
      LauncherWindow.instance = null;
    });

    LauncherWindow.instance = window;
    return window;
  }

  public static getInstance(): BrowserWindow | null {
    return LauncherWindow.instance;
  }

  public static close(): void {
    if (LauncherWindow.instance && !LauncherWindow.instance.isDestroyed()) {
      LauncherWindow.instance.close();
    }
  }

  public static focus(): void {
    if (LauncherWindow.instance && !LauncherWindow.instance.isDestroyed()) {
      LauncherWindow.instance.focus();
    }
  }
}
