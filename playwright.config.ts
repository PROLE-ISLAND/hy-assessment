// =====================================================
// Playwright Configuration
// E2E tests organized by DoD Level: Gold / Integration
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
    // =========================================
    // Setup project - runs first to authenticate
    // =========================================
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      timeout: 120000, // 2 minutes for cold start
    },

    // =========================================
    // 🥇 Gold E2E Tests (本番リリース基準)
    // 5本: 事業成立の証明
    // Run with: npx playwright test --project=gold
    // =========================================
    {
      name: 'gold',
      testDir: './e2e/gold',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // =========================================
    // 🥈 Integration Tests (マージ可能基準)
    // 機能単位のテスト
    // Run with: npx playwright test --project=integration
    // =========================================
    {
      name: 'integration',
      testDir: './e2e/integration',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // =========================================
    // Default: All tests (backward compatibility)
    // Run with: npx playwright test --project=chromium
    // =========================================
    {
      name: 'chromium',
      testIgnore: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
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
