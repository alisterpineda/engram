import { test, expect } from '@playwright/test';
import {
  setupTestSpace,
  cleanupTestSpace,
  launchElectronApp,
  closeElectronApp,
  type TestContext,
} from './helpers/test-utils';

test.describe('Electron App', () => {
  let testContext: TestContext;
  let spacePath: string;
  let userDataPath: string;

  test.beforeEach(async () => {
    // Setup: Create fresh test space from snapshot
    const paths = setupTestSpace();
    spacePath = paths.spacePath;
    userDataPath = paths.userDataPath;

    // Launch the Electron app with test arguments
    testContext = await launchElectronApp(spacePath, userDataPath);
  });

  test.afterEach(async () => {
    // Cleanup: Close app and remove test space
    if (testContext?.electronApp) {
      await closeElectronApp(testContext.electronApp);
    }

    if (spacePath && userDataPath) {
      cleanupTestSpace(spacePath, userDataPath);
    }
  });

  test('should launch the app successfully', async () => {
    // Verify the window is open
    expect(testContext.window).toBeTruthy();

    // Verify the window title contains "Engram"
    const title = await testContext.window.title();
    expect(title).toContain('Engram');

    // Verify the window has loaded content (body element exists)
    const body = await testContext.window.locator('body');
    await expect(body).toBeAttached();

    // Wait for the feed view to render by checking for the composer prompt
    const feedViewPrompt = testContext.window.getByText("What's on your mind?");
    await expect(feedViewPrompt).toBeVisible();
  });
});
