/**
 * Shared types between main and renderer processes
 */

export interface WorkspaceInfo {
  name: string;
  path: string;
  lastOpened: number;
}

export interface AppStateData {
  recentWorkspaces: WorkspaceInfo[];
  lastOpenedWorkspace?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export interface CreateWorkspaceParams {
  name: string;
  path: string;
}

export interface WorkspaceData {
  name: string;
  path: string;
}
