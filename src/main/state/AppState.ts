import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { AppStateData, SpaceInfo } from '../../shared/types';

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
      recentSpaces: [],
    };
  }

  private save(): void {
    try {
      fs.writeFileSync(this.statePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving app state:', error);
    }
  }

  public addRecentSpace(space: SpaceInfo): void {
    // Remove existing entry for the same path
    this.data.recentSpaces = this.data.recentSpaces.filter(
      (s) => s.path !== space.path
    );

    // Add to the beginning
    this.data.recentSpaces.unshift(space);

    // Keep only the last 10
    if (this.data.recentSpaces.length > 10) {
      this.data.recentSpaces = this.data.recentSpaces.slice(0, 10);
    }

    this.save();
  }

  public setLastOpened(spacePath: string): void {
    this.data.lastOpenedSpace = spacePath;
    this.save();
  }

  public getLastOpened(): string | undefined {
    return this.data.lastOpenedSpace;
  }

  public getRecentSpaces(): SpaceInfo[] {
    return this.data.recentSpaces;
  }

  public removeRecentSpace(spacePath: string): void {
    this.data.recentSpaces = this.data.recentSpaces.filter(
      (s) => s.path !== spacePath
    );
    if (this.data.lastOpenedSpace === spacePath) {
      this.data.lastOpenedSpace = undefined;
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
