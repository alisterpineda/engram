import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test';

/**
 * Test context that gets passed to tests
 */
export interface TestContext {
  electronApp: ElectronApplication;
  window: Page;
  testSpacePath: string;
  testUserDataPath: string;
}

/**
 * Copy directory recursively
 */
function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Creates a test space by copying the snapshot to a temp directory
 */
export function setupTestSpace(): { spacePath: string; userDataPath: string } {
  const snapshotPath = path.join(__dirname, '../../tests/fixtures/snapshot-space');

  // Verify snapshot exists
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(
      'Test snapshot Space not found. Run "npm run test:create-snapshot" first.'
    );
  }

  // Create temp directories
  const testId = `engram-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const spacePath = path.join(os.tmpdir(), testId, 'space');
  const userDataPath = path.join(os.tmpdir(), testId, 'userdata');

  // Copy snapshot to temp location
  copyDir(snapshotPath, spacePath);
  fs.mkdirSync(userDataPath, { recursive: true });

  return { spacePath, userDataPath };
}

/**
 * Cleans up test space and userData directory
 */
export function cleanupTestSpace(spacePath: string, userDataPath: string): void {
  // Get the parent directory that contains both space and userdata
  const testDir = path.dirname(spacePath);

  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

/**
 * Launches the Electron app in test mode
 */
export async function launchElectronApp(
  spacePath: string,
  userDataPath: string
): Promise<TestContext> {
  // Determine the platform-specific webpack build path
  const arch = process.arch; // 'arm64', 'x64', etc.
  const platform = process.platform; // 'darwin', 'win32', 'linux'

  // Check for dev build first (created by npm start), then fallback to package build
  const devBuildPath = path.join(__dirname, '../../.webpack/main/index.js');
  const packageBuildPath = path.join(__dirname, `../../.webpack/${arch}/main/index.js`);

  let appPath: string;
  if (fs.existsSync(devBuildPath)) {
    appPath = devBuildPath;
  } else if (fs.existsSync(packageBuildPath)) {
    appPath = packageBuildPath;
  } else {
    throw new Error(
      `Webpack build not found. Run "npm test" (auto-builds) or "npm start" first.`
    );
  }

  // Launch Electron with test arguments
  const electronApp = await electron.launch({
    args: [
      appPath,
      `--test-space-path=${spacePath}`,
      `--user-data-dir=${userDataPath}`,
    ],
    // Set to true for debugging
    // executablePath: '/path/to/electron',
  });

  // Wait for the first window
  const window = await electronApp.firstWindow();

  return {
    electronApp,
    window,
    testSpacePath: spacePath,
    testUserDataPath: userDataPath,
  };
}

/**
 * Closes the Electron app
 */
export async function closeElectronApp(electronApp: ElectronApplication): Promise<void> {
  await electronApp.close();
}
