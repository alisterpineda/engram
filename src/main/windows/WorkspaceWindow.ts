import { BrowserWindow } from 'electron';
import { WorkspaceManager } from '../workspace/WorkspaceManager';

// Magic constants from Webpack
declare const WORKSPACE_WINDOW_WEBPACK_ENTRY: string;
declare const WORKSPACE_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

interface WorkspaceWindowInfo {
  window: BrowserWindow;
  path: string;
}

export class WorkspaceWindow {
  private static windows: Map<string, WorkspaceWindowInfo> = new Map();

  public static async create(workspacePath: string): Promise<BrowserWindow> {
    // Check if workspace is already open
    const existing = WorkspaceWindow.windows.get(workspacePath);
    if (existing && !existing.window.isDestroyed()) {
      existing.window.focus();
      return existing.window;
    }

    // Open the workspace
    const workspaceManager = WorkspaceManager.getInstance();
    const workspaceData = await workspaceManager.openWorkspace(workspacePath);

    const window = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: WORKSPACE_WINDOW_PRELOAD_WEBPACK_ENTRY,
        additionalArguments: [`--workspace-path=${workspacePath}`],
      },
      title: `${workspaceData.name} - Engram`,
    });

    window.loadURL(WORKSPACE_WINDOW_WEBPACK_ENTRY);

    // Open DevTools in development
    if (process.env.NODE_ENV !== 'production') {
      window.webContents.openDevTools();
    }

    // Handle window close
    window.on('closed', async () => {
      await workspaceManager.closeWorkspace(workspacePath);
      WorkspaceWindow.windows.delete(workspacePath);
    });

    WorkspaceWindow.windows.set(workspacePath, { window, path: workspacePath });
    return window;
  }

  public static getWindow(workspacePath: string): BrowserWindow | undefined {
    const info = WorkspaceWindow.windows.get(workspacePath);
    return info?.window;
  }

  public static getAllWindows(): BrowserWindow[] {
    return Array.from(WorkspaceWindow.windows.values())
      .map((info) => info.window)
      .filter((win) => !win.isDestroyed());
  }

  public static getWorkspacePath(window: BrowserWindow): string | undefined {
    for (const [path, info] of WorkspaceWindow.windows.entries()) {
      if (info.window === window) {
        return path;
      }
    }
    return undefined;
  }
}
