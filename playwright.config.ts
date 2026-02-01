import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing.
 *
 * USAGE:
 * 1. Start the dev server: npm run web
 * 2. Run tests: npm run e2e
 *
 * The webServer config will auto-start in CI but reuses existing server locally.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npx expo start --web',
    url: 'http://localhost:8081',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
