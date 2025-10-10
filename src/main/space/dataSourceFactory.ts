import { DataSource } from 'typeorm';
import { Setting } from './entities/Setting';
import { Note } from './entities/Note';
import { Log } from './entities/Log';
import { Page } from './entities/Page';
import { Contact } from './entities/Contact';
import { Comment } from './entities/Comment';
import { NoteReference } from './entities/NoteReference';
import { allMigrations } from './migrations';

export function createDataSource(dbPath: string): DataSource {
  return new DataSource({
    type: 'better-sqlite3',
    database: dbPath,
    entities: [Setting, Note, Log, Page, Contact, Comment, NoteReference],
    migrations: allMigrations,
    migrationsRun: false,
    synchronize: false, // explicitly set to false to avoid accidental schema sync
    logging: process.env.NODE_ENV !== 'production',
  });
}
