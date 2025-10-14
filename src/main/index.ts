import 'reflect-metadata';
import { app } from 'electron';
import * as fs from 'fs';
import { AppState } from './state/AppState';
import { LauncherWindow } from './windows/LauncherWindow';
import { SpaceWindow } from './windows/SpaceWindow';
import { registerLauncherHandlers } from './ipc/launcherHandlers';
import { registerWorkspaceHandlers } from './ipc/workspaceHandlers';
import { registerThemeHandlers } from './ipc/themeHandlers';
import { setupMenu } from './menu';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Parse command-line arguments for test mode
interface TestModeArgs {
  testSpacePath?: string;
  userDataDir?: string;
}

function parseTestModeArgs(): TestModeArgs {
  const args: TestModeArgs = {};

  process.argv.forEach((arg) => {
    if (arg.startsWith('--test-space-path=')) {
      args.testSpacePath = arg.split('=')[1];
    } else if (arg.startsWith('--user-data-dir=')) {
      args.userDataDir = arg.split('=')[1];
    }
  });

  return args;
}

const testModeArgs = parseTestModeArgs();

// Override userData directory if specified (for test isolation)
if (testModeArgs.userDataDir) {
  app.setPath('userData', testModeArgs.userDataDir);
}

// Register IPC handlers
registerLauncherHandlers();
registerWorkspaceHandlers();
registerThemeHandlers();

async function initializeApp(): Promise<void> {
  // Test mode: directly open the specified space and skip launcher
  if (testModeArgs.testSpacePath) {
    try {
      await SpaceWindow.create(testModeArgs.testSpacePath);
      return;
    } catch (error) {
      console.error('Error opening test space:', error);
      app.quit();
      return;
    }
  }

  // Normal mode: check for last opened space
  const appState = AppState.getInstance();
  const lastOpenedPath = appState.getLastOpened();

  // Check if we have a last opened space and if it exists
  if (lastOpenedPath && fs.existsSync(lastOpenedPath)) {
    try {
      await SpaceWindow.create(lastOpenedPath);
      return;
    } catch (error) {
      console.error('Error opening last space:', error);
      // Fall through to open launcher
    }
  }

  // Open launcher window if no space to open
  LauncherWindow.create();
}

// This method will be called when Electron has finished initialization
app.on('ready', () => {
  setupMenu();
  initializeApp();
});

// Quit when all windows are closed (including on macOS)
app.on('window-all-closed', () => {
  app.quit();
});
