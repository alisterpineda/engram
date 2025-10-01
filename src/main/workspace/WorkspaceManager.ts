import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { createDataSource } from './dataSourceFactory';
import { Setting } from './entities/Setting';
import { WorkspaceData } from '../../shared/types';

interface OpenWorkspace {
  dataSource: DataSource;
  path: string;
}

export class WorkspaceManager {
  private static instance: WorkspaceManager;
  private openWorkspaces: Map<string, OpenWorkspace>;

  private constructor() {
    this.openWorkspaces = new Map();
  }

  public static getInstance(): WorkspaceManager {
    if (!WorkspaceManager.instance) {
      WorkspaceManager.instance = new WorkspaceManager();
    }
    return WorkspaceManager.instance;
  }

  public async createWorkspace(name: string, filePath: string): Promise<WorkspaceData> {
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      throw new Error('Workspace file already exists at this location');
    }

    // Ensure parent directory exists
    const parentDir = path.dirname(filePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Create the DataSource
    const dataSource = createDataSource(filePath);

    // Initialize the connection (this will create the file and tables)
    await dataSource.initialize();

    // Add the workspace name to settings
    const settingsRepo = dataSource.getRepository(Setting);
    const nameSetting = settingsRepo.create({
      key: 'workspace_name',
      value: name,
    });
    await settingsRepo.save(nameSetting);

    // Close the connection (it will be reopened when the workspace window is created)
    await dataSource.destroy();

    return {
      name,
      path: filePath,
    };
  }

  public async openWorkspace(filePath: string): Promise<WorkspaceData> {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('Workspace file does not exist');
    }

    // Check if already open
    if (this.openWorkspaces.has(filePath)) {
      const workspace = this.openWorkspaces.get(filePath);
      const name = await this.getWorkspaceName(workspace.dataSource);
      return { name, path: filePath };
    }

    // Create and initialize DataSource
    const dataSource = createDataSource(filePath);
    await dataSource.initialize();

    // Verify it's a valid workspace by checking for settings table
    const settingsRepo = dataSource.getRepository(Setting);
    const nameSetting = await settingsRepo.findOne({ where: { key: 'workspace_name' } });

    if (!nameSetting) {
      await dataSource.destroy();
      throw new Error('Invalid workspace file: missing workspace name');
    }

    // Store the connection
    this.openWorkspaces.set(filePath, { dataSource, path: filePath });

    return {
      name: nameSetting.value,
      path: filePath,
    };
  }

  public async closeWorkspace(filePath: string): Promise<void> {
    const workspace = this.openWorkspaces.get(filePath);
    if (workspace) {
      await workspace.dataSource.destroy();
      this.openWorkspaces.delete(filePath);
    }
  }

  public async getWorkspaceName(dataSourceOrPath: DataSource | string): Promise<string> {
    let dataSource: DataSource;

    if (typeof dataSourceOrPath === 'string') {
      const workspace = this.openWorkspaces.get(dataSourceOrPath);
      if (!workspace) {
        throw new Error('Workspace is not open');
      }
      dataSource = workspace.dataSource;
    } else {
      dataSource = dataSourceOrPath;
    }

    const settingsRepo = dataSource.getRepository(Setting);
    const nameSetting = await settingsRepo.findOne({ where: { key: 'workspace_name' } });

    if (!nameSetting) {
      throw new Error('Workspace name not found in settings');
    }

    return nameSetting.value;
  }

  public async renameWorkspace(filePath: string, newName: string): Promise<void> {
    const workspace = this.openWorkspaces.get(filePath);
    if (!workspace) {
      throw new Error('Workspace is not open');
    }

    const settingsRepo = workspace.dataSource.getRepository(Setting);
    const nameSetting = await settingsRepo.findOne({ where: { key: 'workspace_name' } });

    if (nameSetting) {
      nameSetting.value = newName;
      await settingsRepo.save(nameSetting);
    } else {
      throw new Error('Workspace name setting not found');
    }
  }

  public isWorkspaceOpen(filePath: string): boolean {
    return this.openWorkspaces.has(filePath);
  }

  public getDataSource(filePath: string): DataSource | undefined {
    const workspace = this.openWorkspaces.get(filePath);
    return workspace?.dataSource;
  }

  public async getSetting(filePath: string, key: string): Promise<string | null> {
    const workspace = this.openWorkspaces.get(filePath);
    if (!workspace) {
      throw new Error('Workspace is not open');
    }

    const settingsRepo = workspace.dataSource.getRepository(Setting);
    const setting = await settingsRepo.findOne({ where: { key } });
    return setting ? setting.value : null;
  }

  public async setSetting(filePath: string, key: string, value: string): Promise<void> {
    const workspace = this.openWorkspaces.get(filePath);
    if (!workspace) {
      throw new Error('Workspace is not open');
    }

    const settingsRepo = workspace.dataSource.getRepository(Setting);
    let setting = await settingsRepo.findOne({ where: { key } });

    if (setting) {
      setting.value = value;
    } else {
      setting = settingsRepo.create({ key, value });
    }

    await settingsRepo.save(setting);
  }
}
