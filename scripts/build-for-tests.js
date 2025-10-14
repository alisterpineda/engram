const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const arch = process.arch;
const packageBuildPath = path.join(__dirname, `../.webpack/${arch}/main/index.js`);
const devBuildPath = path.join(__dirname, '../.webpack/main/index.js');

// Check for dev build first (created by npm start)
let webpackBuildPath;
if (fs.existsSync(devBuildPath)) {
  webpackBuildPath = devBuildPath;
  console.log('✓ Using dev build from npm start');
} else if (fs.existsSync(packageBuildPath)) {
  webpackBuildPath = packageBuildPath;
} else {
  console.log('No test build found. Running electron-forge package...');
  execSync('npm run package', { stdio: 'inherit' });
  console.log('✓ Test build complete');
  process.exit(0);
}

// Check if source files are newer than build
const buildTime = fs.statSync(webpackBuildPath).mtimeMs;

// Check key source directories
const srcDirs = [
  path.join(__dirname, '../src/main'),
  path.join(__dirname, '../src/renderer'),
  path.join(__dirname, '../src/preload'),
];

let needsRebuild = false;

for (const srcDir of srcDirs) {
  const files = getAllFiles(srcDir);
  for (const file of files) {
    const fileTime = fs.statSync(file).mtimeMs;
    if (fileTime > buildTime) {
      needsRebuild = true;
      break;
    }
  }
  if (needsRebuild) break;
}

if (needsRebuild) {
  console.log('Source files changed. Rebuilding for tests...');
  execSync('npm run package', { stdio: 'inherit' });
  console.log('✓ Test build complete');
} else {
  console.log('✓ Test build is up to date');
}

// Helper function to recursively get all files
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}
