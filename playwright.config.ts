// =====================================================
// Playwright Configuration
// E2E tests for login, candidate flow, assessment flow
// =====================================================

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // Run tests in files sequentially, but files can run in parallel with limited workers
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // Add retries to handle rate limiting and flaky tests
  retries: process.env.CI ? 2 : 1,
  // Limit workers to avoid Supabase Auth rate limiting
  workers: process.env.CI ? 1 : 3,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
    ...(process.env.CI ? [['github', {}] as const] : []),
  ],

  // Global timeout settings
  timeout: 30000,
  expect: {
    timeout: 10000,
  },

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Add action timeout
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },

  projects: [
    // Setup project - runs first to authenticate
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Auth tests - run without storageState (test login/logout/redirect)
    {
      name: 'auth-tests',
      testMatch: /01-auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      // No storageState - tests run as unauthenticated user
    },
    // Main tests - depend on setup and use saved auth state
    {
      name: 'chromium',
      testIgnore: /01-auth\.spec\.ts/,  // Skip auth tests in this project
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Run dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
