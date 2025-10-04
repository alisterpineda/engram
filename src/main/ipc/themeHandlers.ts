import { ipcMain, nativeTheme, BrowserWindow } from 'electron';
import { AppState } from '../state/AppState';

export function registerThemeHandlers(): void {
  const appState = AppState.getInstance();

  // Get app theme preference
  ipcMain.handle('get-app-theme', () => {
    return { success: true, theme: appState.getTheme() };
  });

  // Set app theme preference
  ipcMain.handle('set-app-theme', (_event, theme: 'light' | 'dark' | 'auto') => {
    appState.setTheme(theme);

    // Notify all windows of theme change
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('theme-changed', theme);
    });

    return { success: true };
  });

  // Get system theme
  ipcMain.handle('get-system-theme', () => {
    return {
      success: true,
      theme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    };
  });

  // Listen for system theme changes
  nativeTheme.on('updated', () => {
    const systemTheme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';

    // Notify all windows of system theme change
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('system-theme-changed', systemTheme);
    });
  });
}
