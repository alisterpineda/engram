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

  test('should create a new log entry', async () => {
    // Wait for the feed view to load
    const composerPrompt = testContext.window.getByText("What's on your mind?");
    await expect(composerPrompt).toBeVisible();

    // Click to expand the composer
    await composerPrompt.click();

    // Wait for the composer to expand and show the editor
    const editor = testContext.window.locator('.tiptap.ProseMirror');
    await expect(editor).toBeVisible();

    // Type content into the editor
    const testContent = 'This is a test log entry created by Playwright';
    await editor.click();
    await editor.fill(testContent);

    // Find and click the Post button
    const postButton = testContext.window.getByRole('button', { name: 'Post' });
    await expect(postButton).toBeEnabled();
    await postButton.click();

    // Wait for the post to appear in the feed
    // The content should be visible in a PostCard
    await expect(testContext.window.getByText(testContent)).toBeVisible();

    // Verify the composer has collapsed back to the prompt
    await expect(composerPrompt).toBeVisible();
  });

  test('should create a log entry with a title', async () => {
    // Wait for the feed view to load
    const composerPrompt = testContext.window.getByText("What's on your mind?");
    await expect(composerPrompt).toBeVisible();

    // Click to expand the composer
    await composerPrompt.click();

    // Wait for the composer to expand
    const editor = testContext.window.locator('.tiptap.ProseMirror');
    await expect(editor).toBeVisible();

    // Fill in the title field
    const testTitle = 'Test Log with Title';
    const titleInput = testContext.window.getByPlaceholder('Title (optional)');
    await expect(titleInput).toBeVisible();
    await titleInput.fill(testTitle);

    // Type content into the editor
    const testContent = 'This log entry has both a title and content';
    await editor.click();
    await editor.fill(testContent);

    // Click the Post button
    const postButton = testContext.window.getByRole('button', { name: 'Post' });
    await expect(postButton).toBeEnabled();
    await postButton.click();

    // Wait for the post to appear in the feed with the title
    await expect(testContext.window.getByText(testTitle)).toBeVisible();
    await expect(testContext.window.getByText(testContent)).toBeVisible();

    // Verify the composer has collapsed back to the prompt
    await expect(composerPrompt).toBeVisible();
  });

  test('should require content to post a log', async () => {
    // Wait for the feed view to load
    const composerPrompt = testContext.window.getByText("What's on your mind?");
    await expect(composerPrompt).toBeVisible();

    // Click to expand the composer
    await composerPrompt.click();

    // Wait for the composer to expand
    const editor = testContext.window.locator('.tiptap.ProseMirror');
    await expect(editor).toBeVisible();

    // The Post button should be disabled when content is empty
    const postButton = testContext.window.getByRole('button', { name: 'Post' });
    await expect(postButton).toBeDisabled();

    // Add a title but no content - Post button should still be disabled
    const titleInput = testContext.window.getByPlaceholder('Title (optional)');
    await titleInput.fill('Title without content');
    await expect(postButton).toBeDisabled();

    // Now add content - Post button should become enabled
    await editor.click();
    await editor.fill('Now there is content');
    await expect(postButton).toBeEnabled();

    // Clear the content - Post button should be disabled again
    await editor.clear();
    await expect(postButton).toBeDisabled();
  });
});
