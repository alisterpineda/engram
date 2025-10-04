import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { AppStateData, WorkspaceInfo } from '../../shared/types';

export class AppState {
  private static instance: AppState;
  private statePath: string;
  private data: AppStateData;

  private constructor() {
    this.statePath = path.join(app.getPath('userData'), 'state.json');
    this.data = this.load();
  }

  public static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState();
    }
    return AppState.instance;
  }

  private load(): AppStateData {
    try {
      if (fs.existsSync(this.statePath)) {
        const content = fs.readFileSync(this.statePath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Error loading app state:', error);
    }
    return {
      recentWorkspaces: [],
    };
  }

  private save(): void {
    try {
      fs.writeFileSync(this.statePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving app state:', error);
    }
  }

  public addRecentWorkspace(workspace: WorkspaceInfo): void {
    // Remove existing entry for the same path
    this.data.recentWorkspaces = this.data.recentWorkspaces.filter(
      (w) => w.path !== workspace.path
    );

    // Add to the beginning
    this.data.recentWorkspaces.unshift(workspace);

    // Keep only the last 10
    if (this.data.recentWorkspaces.length > 10) {
      this.data.recentWorkspaces = this.data.recentWorkspaces.slice(0, 10);
    }

    this.save();
  }

  public setLastOpened(workspacePath: string): void {
    this.data.lastOpenedWorkspace = workspacePath;
    this.save();
  }

  public getLastOpened(): string | undefined {
    return this.data.lastOpenedWorkspace;
  }

  public getRecentWorkspaces(): WorkspaceInfo[] {
    return this.data.recentWorkspaces;
  }

  public removeRecentWorkspace(workspacePath: string): void {
    this.data.recentWorkspaces = this.data.recentWorkspaces.filter(
      (w) => w.path !== workspacePath
    );
    if (this.data.lastOpenedWorkspace === workspacePath) {
      this.data.lastOpenedWorkspace = undefined;
    }
    this.save();
  }

  public getTheme(): 'light' | 'dark' | 'auto' {
    return this.data.theme || 'auto';
  }

  public setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.data.theme = theme;
    this.save();
  }
}
