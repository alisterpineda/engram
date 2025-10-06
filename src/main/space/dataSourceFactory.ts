import { DataSource } from 'typeorm';
import { Setting } from './entities/Setting';
import { Entry } from './entities/Entry';
import { allMigrations } from './migrations';

export function createDataSource(dbPath: string): DataSource {
  return new DataSource({
    type: 'better-sqlite3',
    database: dbPath,
    entities: [Setting, Entry],
    migrations: allMigrations,
    migrationsRun: false,
    synchronize: false, // explicitly set to false to avoid accidental schema sync
    logging: process.env.NODE_ENV !== 'production',
  });
}
