/**
 * Creates a pre-migrated test snapshot Space
 * This snapshot is used as a "golden" copy for tests
 */

import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { createDataSource } from '../src/main/space/dataSourceFactory';

const snapshotDir = path.join(__dirname, '../tests/fixtures/snapshot-space');
const dbPath = path.join(snapshotDir, 'space.sqlite');

async function createSnapshot() {
  console.log('Creating test snapshot Space...');

  // Clean up existing snapshot if it exists
  if (fs.existsSync(snapshotDir)) {
    console.log('Removing existing snapshot...');
    fs.rmSync(snapshotDir, { recursive: true, force: true });
  }

  // Create snapshot directory
  fs.mkdirSync(snapshotDir, { recursive: true });
  console.log(`Created snapshot directory: ${snapshotDir}`);

  // Create and initialize the DataSource
  const dataSource = createDataSource(dbPath);

  try {
    // Initialize the connection
    console.log('Initializing database connection...');
    await dataSource.initialize();

    // Run all migrations
    console.log('Running migrations...');
    const migrations = await dataSource.runMigrations({
      transaction: 'each',
    });

    console.log(`Successfully ran ${migrations.length} migration(s)`);
    migrations.forEach((migration, index) => {
      console.log(`  ${index + 1}. ${migration.name}`);
    });

    // Close the connection
    await dataSource.destroy();
    console.log('\nTest snapshot Space created successfully!');
    console.log(`Location: ${snapshotDir}`);
  } catch (error) {
    console.error('Error creating test snapshot:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    // Clean up on error
    if (fs.existsSync(snapshotDir)) {
      fs.rmSync(snapshotDir, { recursive: true, force: true });
    }
    process.exit(1);
  }
}

// Run the script
createSnapshot().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
