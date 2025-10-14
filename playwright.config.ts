import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for Electron app testing
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // No retries
  retries: 0,

  // Reporter to use
  reporter: 'html',

  // Shared settings for all the projects below
  use: {
    // Base timeout for each test
    actionTimeout: 30000,

    // Capture screenshot when the first failure occurs
    screenshot: 'on-first-failure',

    // Collect trace on failure
    trace: 'on-first-retry',
  },

  // Configure projects for different test modes
  projects: [
    {
      name: 'electron',
      testMatch: /.*\.spec\.ts/,
      use: {
        // Headed mode shows the Electron window (useful for debugging)
        // Headless mode hides it (useful for CI)
        headless: process.env.CI ? true : !process.env.HEADED,
      },
    },
  ],

  // Output folder for test results
  outputDir: 'test-results/',
});
