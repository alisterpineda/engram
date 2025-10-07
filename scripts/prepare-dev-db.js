const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const devDbPath = path.join(__dirname, '../.dev/dev-space.sqlite');

console.log('Preparing dev database for migration generation...');

// Delete dev database if it exists
if (fs.existsSync(devDbPath)) {
  fs.unlinkSync(devDbPath);
  console.log('  ✓ Deleted existing dev database');
}

// Ensure .dev directory exists
const devDir = path.dirname(devDbPath);
if (!fs.existsSync(devDir)) {
  fs.mkdirSync(devDir, { recursive: true });
}

// Create empty database file
fs.writeFileSync(devDbPath, '');
console.log('  ✓ Created fresh dev database');

// Run migrations
console.log('  ✓ Running existing migrations...');
try {
  execSync('npm run migration:run', { stdio: 'inherit' });
  console.log('✓ Dev database prepared successfully');
} catch (error) {
  // If no migrations exist yet, that's okay
  if (error.message.includes('No migrations are pending')) {
    console.log('✓ Dev database prepared successfully (no migrations to run)');
  } else {
    throw error;
  }
}
