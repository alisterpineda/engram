import { DataSource } from 'typeorm';
import { Setting } from './entities/Setting';
import { Note } from './entities/Note';
import { Log } from './entities/Log';
import { NoteReference } from './entities/NoteReference';
import { allMigrations } from './migrations';
import * as path from 'path';

// This DataSource is used by the TypeORM CLI for generating migrations
// It points to a dev database so we can generate migrations from entity changes
export default new DataSource({
  type: 'better-sqlite3',
  database: path.join(__dirname, '../../../.dev/dev-space.sqlite'),
  entities: [Setting, Note, Log, NoteReference],
  migrations: allMigrations,
  synchronize: false,
  logging: true,
});
