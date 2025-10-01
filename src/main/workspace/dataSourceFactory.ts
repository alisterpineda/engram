import { DataSource } from 'typeorm';
import { Setting } from './entities/Setting';

export function createDataSource(dbPath: string): DataSource {
  return new DataSource({
    type: 'better-sqlite3',
    database: dbPath,
    entities: [Setting],
    synchronize: true, // Auto-create tables if they don't exist
    logging: false,
  });
}
