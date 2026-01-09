// =====================================================
// Playwright Configuration
// E2E tests for login, candidate flow, assessment flow
// =====================================================

import { defineConfig, devices } from '@playwright/test';

// Check if we should skip the local webServer (when using external URL like Vercel Preview)
const skipWebServer = process.env.SKIP_WEB_SERVER === 'true' ||
  (process.env.BASE_URL && !process.env.BASE_URL.includes('localhost'));

// Vercel Deployment Protection bypass header
const vercelBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const extraHTTPHeaders = vercelBypassSecret
  ? { 'x-vercel-protection-bypass': vercelBypassSecret }
  : undefined;

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
    // Vercel Deployment Protection bypass
    extraHTTPHeaders,
  },

  projects: [
    // =====================================================
    // Setup Projects (run in order: setup → data-setup)
    // =====================================================

    // Auth setup - runs first to authenticate
    // Needs longer timeout for Vercel Preview cold starts
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      timeout: 120000, // 2 minutes for cold start
    },

    // Data setup - creates test data using factories
    // Runs after auth setup, before tests
    // @see Issue #180 - Phase 3: セットアップ統合
    {
      name: 'data-setup',
      testMatch: /setup\/data\.setup\.ts/,
      dependencies: ['setup'],
      timeout: 60000, // 1 minute for data creation
    },

    // =====================================================
    // Gold E2E Tests (5-10 critical business flows)
    // Run on every deploy, must always pass
    // =====================================================
    {
      name: 'gold-auth',
      testMatch: /gold\/auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      // No storageState - tests login flow
    },
    {
      name: 'gold-public',
      testMatch: /gold\/direct-assessment\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      // No storageState - public flow (no authentication required)
      // No dependencies - runs independently
    },
    {
      name: 'gold',
      testDir: './e2e/gold',
      testIgnore: [/auth\.spec\.ts/, /direct-assessment\.spec\.ts/],  // Auth and public tests run separately
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup', 'data-setup'],
    },

    // =====================================================
    // Integration Tests (Silver level)
    // More comprehensive testing, run on PR
    // =====================================================
    {
      name: 'integration',
      testDir: './e2e/integration',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup', 'data-setup'],
    },

    // =====================================================
    // Legacy: Full test run (all tests)
    // For backwards compatibility
    // =====================================================
    {
      name: 'chromium',
      testDir: './e2e',
      testIgnore: [/auth\.setup\.ts/, /gold\/auth\.spec\.ts/, /setup\/data\.(setup|teardown)\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup', 'data-setup'],
    },

    // =====================================================
    // Cleanup Project - runs after all tests
    // Cleans up test data created by data-setup
    // @see Issue #180 - Phase 3: セットアップ統合
    // =====================================================
    {
      name: 'cleanup',
      testMatch: /setup\/data\.teardown\.ts/,
      dependencies: ['gold', 'integration'],
      timeout: 60000, // 1 minute for cleanup
    },
  ],

  // Run dev server before tests (skip when using external URL)
  webServer: skipWebServer ? undefined : {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
