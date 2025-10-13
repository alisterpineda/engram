import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { createDataSource } from './dataSourceFactory';
import { Setting } from './entities/Setting';
import { Note } from './entities/Note';
import { Log } from './entities/Log';
import { Page } from './entities/Page';
import { Comment } from './entities/Comment';
import { NoteReference } from './entities/NoteReference';
import { SpaceData } from '../../shared/types';
import { generateTextFromContentJson } from '../utils/textGeneration';

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
    referenceIds?: number[],
    startedAt?: Date,
    endedAt?: Date | null,
    title?: string | null
  ): Promise<Log> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    // Set startedAt to current time if not provided
    const entryStartedAt = startedAt || new Date();

    // Validate: if endedAt is provided, it must be greater than startedAt
    if (endedAt && endedAt <= entryStartedAt) {
      throw new Error('End time must be greater than started time');
    }

    // Validate: title length if provided
    if (title && title.length > 255) {
      throw new Error('Title must be 255 characters or less');
    }

    // Normalize empty/whitespace-only titles to null
    const normalizedTitle = title && title.trim() ? title.trim() : null;

    // Generate plain text from contentJson
    const contentText = generateTextFromContentJson(contentJson);

    const entryRepo = space.dataSource.getRepository(Log);
    const entry = entryRepo.create({
      title: normalizedTitle,
      contentJson,
      contentText,
      startedAt: entryStartedAt,
      endedAt: endedAt || null,
    });

    const savedEntry = await entryRepo.save(entry);

    // Create references if provided
    if (referenceIds && referenceIds.length > 0) {
      const refRepo = space.dataSource.getRepository(NoteReference);
      for (const targetId of referenceIds) {
        if (targetId === savedEntry.id) {
          throw new Error('Cannot create a reference to itself');
        }
        const ref = refRepo.create({
          sourceId: savedEntry.id,
          targetId,
        });
        await refRepo.save(ref);
      }
    }

    return savedEntry;
  }

  public async getAllEntries(
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

  public async updateEntry(
    folderPath: string,
    id: number,
    contentJson: string,
    startedAt?: Date,
    endedAt?: Date | null,
    title?: string | null
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
    entry.contentText = generateTextFromContentJson(contentJson);

    // Update title if provided
    if (title !== undefined) {
      // Validate: title length if provided
      if (title && title.length > 255) {
        throw new Error('Title must be 255 characters or less');
      }

      // Normalize empty/whitespace-only titles to null
      entry.title = title && title.trim() ? title.trim() : null;
    }

    // Update startedAt if provided
    if (startedAt !== undefined) {
      entry.startedAt = startedAt;
    }

    // Update endedAt if provided
    if (endedAt !== undefined) {
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

  public async getReferencedNotes(folderPath: string, id: number): Promise<Log[]> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const refRepo = space.dataSource.getRepository(NoteReference);
    const references = await refRepo.find({
      where: { sourceId: id },
      relations: ['target'],
    });

    return references.map((ref) => ref.target) as Log[];
  }

  private serializeNoteForReference(note: Note) {
    if (note instanceof Log) {
      return {
        id: note.id,
        title: note.title,
        contentJson: note.contentJson,
        contentText: note.contentText,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        startedAt: note.startedAt,
        endedAt: note.endedAt,
        type: 'log' as const,
      };
    }

    if (note instanceof Comment) {
      return {
        id: note.id,
        parentId: note.parentId,
        title: note.title,
        contentJson: note.contentJson,
        contentText: note.contentText,
        commentedAt: note.commentedAt,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        type: 'comment' as const,
      };
    }

    return {
      id: note.id,
      title: note.title,
      contentJson: note.contentJson,
      contentText: note.contentText,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      type: 'page' as const,
    };
  }

  public async getNoteReferences(
    folderPath: string,
    noteId: number
  ): Promise<{
    incoming: ReturnType<SpaceManager['serializeNoteForReference']>[];
    outgoing: ReturnType<SpaceManager['serializeNoteForReference']>[];
  }> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const refRepo = space.dataSource.getRepository(NoteReference);

    // Get incoming references (where this note is the target)
    const incomingRefs = await refRepo.find({
      where: { targetId: noteId },
      relations: ['source'],
    });

    // Get outgoing references (where this note is the source)
    const outgoingRefs = await refRepo.find({
      where: { sourceId: noteId },
      relations: ['target'],
    });

    return {
      incoming: incomingRefs.map((ref) => this.serializeNoteForReference(ref.source)),
      outgoing: outgoingRefs.map((ref) => this.serializeNoteForReference(ref.target)),
    };
  }

  public async addReference(
    folderPath: string,
    sourceId: number,
    targetId: number
  ): Promise<void> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    // Validate sourceId != targetId
    if (sourceId === targetId) {
      throw new Error('Cannot create a reference to itself');
    }

    const refRepo = space.dataSource.getRepository(NoteReference);
    const ref = refRepo.create({
      sourceId,
      targetId,
    });

    await refRepo.save(ref);
  }

  public async removeReference(
    folderPath: string,
    sourceId: number,
    targetId: number
  ): Promise<void> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const refRepo = space.dataSource.getRepository(NoteReference);
    const ref = await refRepo.findOne({
      where: { sourceId, targetId },
    });

    if (!ref) {
      throw new Error('Reference not found');
    }

    await refRepo.remove(ref);
  }

  // Page CRUD operations
  public async createPage(
    folderPath: string,
    contentJson: string,
    title: string,
    referenceIds?: number[]
  ): Promise<Page> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    // Validate title is required
    if (!title || !title.trim()) {
      throw new Error('Page title is required');
    }

    // Validate: title length
    if (title.length > 255) {
      throw new Error('Title must be 255 characters or less');
    }

    // Generate plain text from contentJson
    const contentText = generateTextFromContentJson(contentJson);

    const pageRepo = space.dataSource.getRepository(Page);
    const page = pageRepo.create({
      title: title.trim(),
      contentJson,
      contentText,
    });

    const savedPage = await pageRepo.save(page);

    // Create references if provided
    if (referenceIds && referenceIds.length > 0) {
      const refRepo = space.dataSource.getRepository(NoteReference);
      for (const targetId of referenceIds) {
        if (targetId === savedPage.id) {
          throw new Error('Cannot create a reference to itself');
        }
        const ref = refRepo.create({
          sourceId: savedPage.id,
          targetId,
        });
        await refRepo.save(ref);
      }
    }

    return savedPage;
  }

  public async getAllPages(
    folderPath: string,
    offset = 0,
    limit = 20
  ): Promise<Page[]> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const pageRepo = space.dataSource.getRepository(Page);
    return await pageRepo.find({
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
  }

  public async getPageById(folderPath: string, id: number): Promise<Page | null> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const pageRepo = space.dataSource.getRepository(Page);
    return await pageRepo.findOne({ where: { id } });
  }

  public async updatePage(
    folderPath: string,
    id: number,
    contentJson: string,
    title: string
  ): Promise<Page> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    // Validate title is required
    if (!title || !title.trim()) {
      throw new Error('Page title is required');
    }

    // Validate: title length
    if (title.length > 255) {
      throw new Error('Title must be 255 characters or less');
    }

    const pageRepo = space.dataSource.getRepository(Page);
    const page = await pageRepo.findOne({ where: { id } });

    if (!page) {
      throw new Error('Page not found');
    }

    page.contentJson = contentJson;
    page.contentText = generateTextFromContentJson(contentJson);
    page.title = title.trim();

    return await pageRepo.save(page);
  }

  public async deletePage(folderPath: string, id: number): Promise<void> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const pageRepo = space.dataSource.getRepository(Page);
    const page = await pageRepo.findOne({ where: { id } });

    if (!page) {
      throw new Error('Page not found');
    }

    await pageRepo.remove(page);
  }

  // Comment CRUD operations
  public async createComment(
    folderPath: string,
    parentId: number,
    contentJson: string,
    commentedAt?: Date,
    title?: string | null
  ): Promise<Comment> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    // Validate parent exists
    const noteRepo = space.dataSource.getRepository(Note);
    const parent = await noteRepo.findOne({ where: { id: parentId } });

    if (!parent) {
      throw new Error('Parent note not found');
    }

    // Validate parent is not a comment
    if (parent instanceof Comment) {
      throw new Error('Cannot create a comment on another comment');
    }

    // Set commentedAt to current time if not provided
    const commentCommentedAt = commentedAt || new Date();

    // Validate: title length if provided
    if (title && title.length > 255) {
      throw new Error('Title must be 255 characters or less');
    }

    // Normalize empty/whitespace-only titles to null
    const normalizedTitle = title && title.trim() ? title.trim() : null;

    // Generate plain text from contentJson
    const contentText = generateTextFromContentJson(contentJson);

    const commentRepo = space.dataSource.getRepository(Comment);
    const comment = commentRepo.create({
      parentId,
      title: normalizedTitle,
      contentJson,
      contentText,
      commentedAt: commentCommentedAt,
    });

    return await commentRepo.save(comment);
  }

  public async getCommentsByParent(
    folderPath: string,
    parentId: number
  ): Promise<Comment[]> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const commentRepo = space.dataSource.getRepository(Comment);
    return await commentRepo.find({
      where: { parentId },
      order: { commentedAt: 'ASC' },
    });
  }

  public async getCommentById(folderPath: string, id: number): Promise<Comment | null> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const commentRepo = space.dataSource.getRepository(Comment);
    return await commentRepo.findOne({ where: { id } });
  }

  public async updateComment(
    folderPath: string,
    id: number,
    contentJson: string,
    commentedAt?: Date,
    title?: string | null
  ): Promise<Comment> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const commentRepo = space.dataSource.getRepository(Comment);
    const comment = await commentRepo.findOne({ where: { id } });

    if (!comment) {
      throw new Error('Comment not found');
    }

    comment.contentJson = contentJson;
    comment.contentText = generateTextFromContentJson(contentJson);

    // Update title if provided
    if (title !== undefined) {
      // Validate: title length if provided
      if (title && title.length > 255) {
        throw new Error('Title must be 255 characters or less');
      }

      // Normalize empty/whitespace-only titles to null
      comment.title = title && title.trim() ? title.trim() : null;
    }

    // Update commentedAt if provided
    if (commentedAt !== undefined) {
      comment.commentedAt = commentedAt;
    }

    return await commentRepo.save(comment);
  }

  public async deleteComment(folderPath: string, id: number): Promise<void> {
    const space = this.openSpaces.get(folderPath);
    if (!space) {
      throw new Error('Space is not open');
    }

    const commentRepo = space.dataSource.getRepository(Comment);
    const comment = await commentRepo.findOne({ where: { id } });

    if (!comment) {
      throw new Error('Comment not found');
    }

    await commentRepo.remove(comment);
  }
}
