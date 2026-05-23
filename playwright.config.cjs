/**
 * playwright.config.js
 * Configures Playwright automated browser tests for CleanFlow.
 *
 * Run commands:
 *   npx playwright test              — run all tests headlessly
 *   npx playwright test --ui         — visual test runner (recommended first run)
 *   npx playwright test --headed     — watch tests run in a real browser
 *   npx playwright show-report       — open HTML test report after a run
 *   npx playwright test security     — run only security tests
 *   npx playwright test admin        — run only admin tests
 *   npx playwright test worker       — run only worker tests
 *
 * Prerequisites:
 *   The backend (port 3000) must be running before starting tests.
 *   The frontend (port 5173) is auto-started by Playwright if not already running.
 */
const { defineConfig, devices } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './tests/e2e',

  // Auto-start the Vite dev server if it isn't already listening on port 5173.
  // Set reuseExistingServer so manual `npm run dev` sessions are respected.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },


  // Run tests in the order they are defined within each file
  fullyParallel: false,

  // Retry once on CI to reduce flakiness from timing issues
  retries: 1,

  // HTML report + console list output
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:5173',
    // Capture screenshot only when a test fails
    screenshot: 'only-on-failure',
    // Retain video only when a test fails
    video: 'retain-on-failure',
    // Timeout for a single action (click, fill, etc.)
    actionTimeout: 10_000,
    // Timeout for page navigations
    navigationTimeout: 15_000,
  },

  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Android', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile iOS',     use: { ...devices['iPhone 12'] } },
  ],
})
