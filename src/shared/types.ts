/**
 * Shared types between main and renderer processes
 */

export interface SpaceInfo {
  name: string;
  path: string;
  lastOpened: number;
}

export interface AppStateData {
  recentSpaces: SpaceInfo[];
  lastOpenedSpace?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export interface CreateSpaceParams {
  name: string;
  path: string;
}

export interface SpaceData {
  name: string;
  path: string;
}
