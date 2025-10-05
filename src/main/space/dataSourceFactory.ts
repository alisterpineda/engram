import { DataSource } from 'typeorm';
import { Setting } from './entities/Setting';
import { Entry } from './entities/Entry';

export function createDataSource(dbPath: string): DataSource {
  return new DataSource({
    type: 'better-sqlite3',
    database: dbPath,
    entities: [Setting, Entry],
    synchronize: true, // Auto-create tables if they don't exist
    logging: false,
  });
}
