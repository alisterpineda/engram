const { execSync } = require('child_process');

// Get migration name from command line args
const migrationPath = process.argv[2];
if (!migrationPath) {
  console.error('Error: Migration path is required');
  console.error('Usage: npm run migration:generate-safe src/main/space/migrations/MigrationName');
  process.exit(1);
}

console.log('Step 1: Preparing dev database...');
try {
  execSync('npm run migration:prepare', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to prepare dev database');
  process.exit(1);
}

console.log('\nStep 2: Generating new migration...');
try {
  execSync(`npm run migration:generate ${migrationPath}`, { stdio: 'inherit' });
  console.log('\n✓ Migration generated successfully');
  console.log('\nNext steps:');
  console.log('1. Review the generated migration file');
  console.log('2. Rename the class to M[timestamp]_DescriptiveName');
  console.log('3. Import and export it in src/main/space/migrations/index.ts');
} catch (error) {
  console.error('Failed to generate migration');
  process.exit(1);
}
