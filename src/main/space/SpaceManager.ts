import { DataSource, IsNull } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { createDataSource } from './dataSourceFactory';
import { Setting } from './entities/Setting';
import { Entry } from './entities/Entry';
import { SpaceData } from '../../shared/types';

interface OpenSpace {
  dataSource: DataSource;
  path: string;
}

export class SpaceManager {
  private static instance: SpaceManager;
  private openSpaces: Map<string, OpenSpace>;

  private constructor() {
    this.openSpaces = new Map();
  }

  public static getInstance(): SpaceManager {
    if (!SpaceManager.instance) {
      SpaceManager.instance = new SpaceManager();
    }
    return SpaceManager.instance;
  }

  private getDatabasePath(folderPath: string): string {
    return path.join(folderPath, 'space.sqlite');
  }

  public async createSpace(name: string, folderPath: string): Promise<SpaceData> {
    // Check if folder already exists
    if (fs.existsSync(folderPath)) {
      throw new Error('Space folder already exists at this location');
    }

    // Create the folder
    fs.mkdirSync(folderPath, { recursive: true });

    const dbPath = this.getDatabasePath(folderPath);

    // Create the DataSource
    const dataSource = createDataSource(dbPath);

    // Initialize the connection (this will create the file and tables)
    await dataSource.initialize();

    // Close the connection (it will be reopened when the space window is created)
    await dataSource.destroy();

    return {
      name,
      path: folderPath,
    };
  }

  public async openSpace(folderPath: string): Promise<SpaceData> {
    // Check if folder exists
    if (!fs.existsSync(folderPath)) {
      throw new Error('Space folder does not exist');
    }

    const dbPath = this.getDatabasePath(folderPath);

    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      throw new Error('Selected folder is not a valid space (missing space.sqlite)');
    }

    // Check if already open
    if (this.openSpaces.has(folderPath)) {
      const space = this.openSpaces.get(folderPath);
      const name = await this.getSpaceName(space.dataSource);
      return { name, path: folderPath };
    }

    // Create and initialize DataSource
    const dataSource = createDataSource(dbPath);
    await dataSource.initialize();

    // Store the connection
    this.openSpaces.set(folderPath, { dataSource, path: folderPath });

    return {
      name: path.basename(folderPath),
      path: folderPath,
    };
  }

  public async closeSpace(folderPath: string): Promise<void> {
    const space = this.openSpaces.get(folderPath);
    if (space) {
      await space.dataSource.destroy();
      this.openSpaces.delete(folderPath);
    }
  }

  public async getSpaceName(dataSourceOrPath: DataSource | string): Promise<string> {
    let folderPath: string;

    if (typeof dataSourceOrPath === 'string') {
      folderPath = dataSourceOrPath;
    } else {
      // Find the folder path from the data source
      const entry = Array.from(this.openSpaces.entries()).find(
        ([_, space]) => space.dataSource === dataSourceOrPath
      );
      if (!entry) {
        throw new Error('Space not found');
      }
      folderPath = entry[0];
    }

    return path.basename(folderPath);
  }

  public isSpaceOpen(folderPath: string): boolean {
    return this.openSpaces.has(folderPath);
  }

  public getDataSource(folderPath: string): DataSource | undefined {
    const space = this.openSpaces.get(folderPath);
    return space?.dataSource;
  }

  public async getSetting(folderPath: string, key: string): Promise<string | null> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const settingsRepo = space.dataSource.getRepository(Setting);
    const setting = await settingsRepo.findOne({ where: { key } });
    return setting ? setting.value : null;
  }

  public async setSetting(folderPath: string, key: string, value: string): Promise<void> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const settingsRepo = space.dataSource.getRepository(Setting);
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
    folderPath: string,
    contentJson: string,
    contentHtml: string,
    parentId?: number | null,
    occurredAt?: Date,
    endedAt?: Date | null
  ): Promise<Entry> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    // Set occurredAt to current time if not provided
    const entryOccurredAt = occurredAt || new Date();

    // Validate: if parentId is not null (comment), endedAt must be null
    if (parentId && endedAt) {
      throw new Error('Comments cannot have an end time');
    }

    // Validate: if endedAt is provided, it must be greater than occurredAt
    if (endedAt && endedAt <= entryOccurredAt) {
      throw new Error('End time must be greater than occurred time');
    }

    const entryRepo = space.dataSource.getRepository(Entry);
    const entry = entryRepo.create({
      contentJson,
      contentHtml,
      parentId: parentId || null,
      occurredAt: entryOccurredAt,
      endedAt: endedAt || null,
    });

    return await entryRepo.save(entry);
  }

  public async getTopLevelEntries(
    folderPath: string,
    offset = 0,
    limit = 20
  ): Promise<Entry[]> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const entryRepo = space.dataSource.getRepository(Entry);
    return await entryRepo.find({
      where: { parentId: IsNull() },
      order: { occurredAt: 'DESC' },
      skip: offset,
      take: limit,
    });
  }

  public async getEntryById(folderPath: string, id: number): Promise<Entry | null> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const entryRepo = space.dataSource.getRepository(Entry);
    return await entryRepo.findOne({ where: { id } });
  }

  public async getChildEntries(
    folderPath: string,
    parentId: number,
    offset?: number,
    limit?: number
  ): Promise<Entry[]> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const entryRepo = space.dataSource.getRepository(Entry);
    return await entryRepo.find({
      where: { parentId },
      order: { createdAt: 'ASC' },
      skip: offset,
      take: limit,
    });
  }

  public async updateEntry(
    folderPath: string,
    id: number,
    contentJson: string,
    contentHtml: string,
    occurredAt?: Date,
    endedAt?: Date | null
  ): Promise<Entry> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const entryRepo = space.dataSource.getRepository(Entry);
    const entry = await entryRepo.findOne({ where: { id } });

    if (!entry) {
      throw new Error('Entry not found');
    }

    entry.contentJson = contentJson;
    entry.contentHtml = contentHtml;

    // Update occurredAt if provided
    if (occurredAt !== undefined) {
      entry.occurredAt = occurredAt;
    }

    // Update endedAt if provided
    if (endedAt !== undefined) {
      // Validate: if parentId is not null (comment), endedAt must be null
      if (entry.parentId && endedAt) {
        throw new Error('Comments cannot have an end time');
      }

      // Validate: if endedAt is provided, it must be greater than occurredAt
      if (endedAt && endedAt <= entry.occurredAt) {
        throw new Error('End time must be greater than occurred time');
      }

      entry.endedAt = endedAt;
    }

    return await entryRepo.save(entry);
  }

  public async deleteEntry(folderPath: string, id: number): Promise<void> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const entryRepo = space.dataSource.getRepository(Entry);
    const entry = await entryRepo.findOne({ where: { id } });

    if (!entry) {
      throw new Error('Entry not found');
    }

    await entryRepo.remove(entry);
  }
}
