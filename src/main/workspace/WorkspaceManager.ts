import { DataSource, IsNull } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { createDataSource } from './dataSourceFactory';
import { Setting } from './entities/Setting';
import { Entry } from './entities/Entry';
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

    // Store the connection
    this.openWorkspaces.set(filePath, { dataSource, path: filePath });

    return {
      name: path.basename(filePath, '.sqlite'),
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
    let filePath: string;

    if (typeof dataSourceOrPath === 'string') {
      filePath = dataSourceOrPath;
    } else {
      // Find the file path from the data source
      const entry = Array.from(this.openWorkspaces.entries()).find(
        ([_, workspace]) => workspace.dataSource === dataSourceOrPath
      );
      if (!entry) {
        throw new Error('Workspace not found');
      }
      filePath = entry[0];
    }

    return path.basename(filePath, '.sqlite');
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

  // Entry CRUD operations
  public async createEntry(
    filePath: string,
    body: string,
    title?: string | null,
    parentId?: number | null
  ): Promise<Entry> {
    const workspace = this.openWorkspaces.get(filePath);
    if (!workspace) {
      throw new Error('Workspace is not open');
    }

    const entryRepo = workspace.dataSource.getRepository(Entry);
    const entry = entryRepo.create({
      title: title || null,
      body,
      parentId: parentId || null,
    });

    return await entryRepo.save(entry);
  }

  public async getTopLevelEntries(
    filePath: string,
    offset = 0,
    limit = 20
  ): Promise<Entry[]> {
    const workspace = this.openWorkspaces.get(filePath);
    if (!workspace) {
      throw new Error('Workspace is not open');
    }

    const entryRepo = workspace.dataSource.getRepository(Entry);
    return await entryRepo.find({
      where: { parentId: IsNull() },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
  }

  public async getEntryById(filePath: string, id: number): Promise<Entry | null> {
    const workspace = this.openWorkspaces.get(filePath);
    if (!workspace) {
      throw new Error('Workspace is not open');
    }

    const entryRepo = workspace.dataSource.getRepository(Entry);
    return await entryRepo.findOne({ where: { id } });
  }

  public async getChildEntries(
    filePath: string,
    parentId: number,
    offset?: number,
    limit?: number
  ): Promise<Entry[]> {
    const workspace = this.openWorkspaces.get(filePath);
    if (!workspace) {
      throw new Error('Workspace is not open');
    }

    const entryRepo = workspace.dataSource.getRepository(Entry);
    return await entryRepo.find({
      where: { parentId },
      order: { createdAt: 'ASC' },
      skip: offset,
      take: limit,
    });
  }

  public async updateEntry(
    filePath: string,
    id: number,
    body: string,
    title?: string | null
  ): Promise<Entry> {
    const workspace = this.openWorkspaces.get(filePath);
    if (!workspace) {
      throw new Error('Workspace is not open');
    }

    const entryRepo = workspace.dataSource.getRepository(Entry);
    const entry = await entryRepo.findOne({ where: { id } });

    if (!entry) {
      throw new Error('Entry not found');
    }

    entry.title = title || null;
    entry.body = body;

    return await entryRepo.save(entry);
  }

  public async deleteEntry(filePath: string, id: number): Promise<void> {
    const workspace = this.openWorkspaces.get(filePath);
    if (!workspace) {
      throw new Error('Workspace is not open');
    }

    const entryRepo = workspace.dataSource.getRepository(Entry);
    const entry = await entryRepo.findOne({ where: { id } });

    if (!entry) {
      throw new Error('Entry not found');
    }

    await entryRepo.remove(entry);
  }
}
