import { DataSource, IsNull } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { createDataSource } from './dataSourceFactory';
import { Setting } from './entities/Setting';
import { Log } from './entities/Log';
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

  private async runMigrations(
    dataSource: DataSource,
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    try {
      const pendingMigrations = await dataSource.showMigrations();
      const totalPending = pendingMigrations ? await dataSource.showMigrations() : false;
      const total = totalPending ? (await dataSource.driver.createSchemaBuilder().log()).upQueries.length : 0;

      if (total > 0 && process.env.NODE_ENV !== 'production') {
        console.log(`Running ${total} pending migration(s)...`);
      }

      // Get migrations before running
      const migrations = await dataSource.runMigrations({
        transaction: 'each',
        // Custom fake executor to track progress
      });

      // Report progress for each migration
      if (onProgress && migrations.length > 0) {
        migrations.forEach((migration, index) => {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`Executed migration: ${migration.name}`);
          }
          onProgress(index + 1, migrations.length);
        });
      }

      if (migrations.length > 0 && process.env.NODE_ENV !== 'production') {
        console.log(`Successfully executed ${migrations.length} migration(s)`);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Migration failed:', error);
      }
      throw error;
    }
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

    try {
      // Initialize the connection
      await dataSource.initialize();

      // Run migrations to set up the database schema
      await this.runMigrations(dataSource);

      // Close the connection (it will be reopened when the space window is created)
      await dataSource.destroy();
    } catch (error) {
      // Clean up on error
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
      throw error;
    }

    return {
      name,
      path: folderPath,
    };
  }

  public async openSpace(
    folderPath: string,
    onMigrationProgress?: (current: number, total: number) => void
  ): Promise<SpaceData> {
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

    try {
      await dataSource.initialize();

      // Run any pending migrations
      await this.runMigrations(dataSource, onMigrationProgress);

      // Store the connection
      this.openSpaces.set(folderPath, { dataSource, path: folderPath });
    } catch (error) {
      // Clean up on error
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
      throw error;
    }

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
    startedAt?: Date,
    endedAt?: Date | null
  ): Promise<Log> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    // Set startedAt to current time if not provided
    const entryStartedAt = startedAt || new Date();

    // Validate: if parentId is not null (comment), endedAt must be null
    if (parentId && endedAt) {
      throw new Error('Comments cannot have an end time');
    }

    // Validate: if endedAt is provided, it must be greater than startedAt
    if (endedAt && endedAt <= entryStartedAt) {
      throw new Error('End time must be greater than started time');
    }

    const entryRepo = space.dataSource.getRepository(Log);
    const entry = entryRepo.create({
      contentJson,
      contentHtml,
      parentId: parentId || null,
      startedAt: entryStartedAt,
      endedAt: endedAt || null,
    });

    return await entryRepo.save(entry);
  }

  public async getTopLevelEntries(
    folderPath: string,
    offset = 0,
    limit = 20
  ): Promise<Log[]> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const entryRepo = space.dataSource.getRepository(Log);
    return await entryRepo.find({
      where: { parentId: IsNull() },
      order: { startedAt: 'DESC' },
      skip: offset,
      take: limit,
    });
  }

  public async getEntryById(folderPath: string, id: number): Promise<Log | null> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const entryRepo = space.dataSource.getRepository(Log);
    return await entryRepo.findOne({ where: { id } });
  }

  public async getChildEntries(
    folderPath: string,
    parentId: number,
    offset?: number,
    limit?: number
  ): Promise<Log[]> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const entryRepo = space.dataSource.getRepository(Log);
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
    startedAt?: Date,
    endedAt?: Date | null
  ): Promise<Log> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const entryRepo = space.dataSource.getRepository(Log);
    const entry = await entryRepo.findOne({ where: { id } });

    if (!entry) {
      throw new Error('Entry not found');
    }

    entry.contentJson = contentJson;
    entry.contentHtml = contentHtml;

    // Update startedAt if provided
    if (startedAt !== undefined) {
      entry.startedAt = startedAt;
    }

    // Update endedAt if provided
    if (endedAt !== undefined) {
      // Validate: if parentId is not null (comment), endedAt must be null
      if (entry.parentId && endedAt) {
        throw new Error('Comments cannot have an end time');
      }

      // Validate: if endedAt is provided, it must be greater than startedAt
      if (endedAt && endedAt <= entry.startedAt) {
        throw new Error('End time must be greater than started time');
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

    const entryRepo = space.dataSource.getRepository(Log);
    const entry = await entryRepo.findOne({ where: { id } });

    if (!entry) {
      throw new Error('Entry not found');
    }

    await entryRepo.remove(entry);
  }
}
