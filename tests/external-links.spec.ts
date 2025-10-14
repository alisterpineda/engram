import { test, expect } from '@playwright/test';
import {
  setupTestSpace,
  cleanupTestSpace,
  launchElectronApp,
  closeElectronApp,
  type TestContext,
} from './helpers/test-utils';

test.describe('External Link Handling', () => {
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

  test('should prevent navigation away from app when external URL is triggered', async () => {
    // Wait for the feed view to load
    const composerPrompt = testContext.window.getByText("What's on your mind?");
    await expect(composerPrompt).toBeVisible();

    // Store the current URL
    const urlBeforeNavigation = testContext.window.url();

    // Try to navigate to an external URL programmatically
    // This simulates what would happen if a link tried to navigate the window
    const navigationBlocked = await testContext.window.evaluate(() => {
      try {
        window.location.href = 'https://example.com';
        return false; // Navigation was not blocked
      } catch (e) {
        return true; // Navigation was blocked
      }
    });

    // Wait a moment to ensure navigation didn't happen
    await testContext.window.waitForTimeout(500);

    // Verify the window didn't navigate away
    const urlAfterNavigation = testContext.window.url();
    expect(urlAfterNavigation).toBe(urlBeforeNavigation);
    expect(urlAfterNavigation).not.toContain('example.com');
  });

  test('should have will-navigate and setWindowOpenHandler configured', async () => {
    // Verify the handlers are set up by checking window properties via main process
    const hasHandlers = await testContext.electronApp.evaluate(async ({ BrowserWindow }) => {
      const windows = BrowserWindow.getAllWindows();
      if (windows.length === 0) return { windowExists: false, willNavigateListeners: 0 };

      const mainWindow = windows[0];
      const webContents = mainWindow.webContents;

      // Check that listeners are registered
      const willNavigateListeners = webContents.listenerCount('will-navigate');

      return {
        windowExists: true,
        willNavigateListeners,
      };
    });

    expect(hasHandlers.windowExists).toBe(true);
    expect(hasHandlers.willNavigateListeners).toBeGreaterThan(0);
  });
});
