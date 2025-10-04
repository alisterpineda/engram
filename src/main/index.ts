import 'reflect-metadata';
import { app } from 'electron';
import * as fs from 'fs';
import { AppState } from './state/AppState';
import { LauncherWindow } from './windows/LauncherWindow';
import { WorkspaceWindow } from './windows/WorkspaceWindow';
import { registerLauncherHandlers } from './ipc/launcherHandlers';
import { registerWorkspaceHandlers } from './ipc/workspaceHandlers';
import { registerThemeHandlers } from './ipc/themeHandlers';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Register IPC handlers
registerLauncherHandlers();
registerWorkspaceHandlers();
registerThemeHandlers();

async function initializeApp(): Promise<void> {
  const appState = AppState.getInstance();
  const lastOpenedPath = appState.getLastOpened();

  // Check if we have a last opened workspace and if it exists
  if (lastOpenedPath && fs.existsSync(lastOpenedPath)) {
    try {
      await WorkspaceWindow.create(lastOpenedPath);
      return;
    } catch (error) {
      console.error('Error opening last workspace:', error);
      // Fall through to open launcher
    }
  }

  // Open launcher window if no workspace to open
  LauncherWindow.create();
}

// This method will be called when Electron has finished initialization
app.on('ready', initializeApp);

// Quit when all windows are closed (including on macOS)
app.on('window-all-closed', () => {
  app.quit();
});
