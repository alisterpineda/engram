import { BrowserWindow } from 'electron';

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
