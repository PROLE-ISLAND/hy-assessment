// =====================================================
// Playwright Auth Setup
// Authenticate and save storage state
// =====================================================

import { test as setup } from '@playwright/test';

const E2E_TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'e2e-test@hy-assessment.local';
const E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'E2ETestSecure123!';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  console.log('[Auth Setup] Starting authentication...');

  // Navigate to login page
  await page.goto('/login');

  // Wait for login form
  await page.waitForSelector('[data-testid="login-email"]', { timeout: 15000 });

  // Fill login form
  await page.fill('[data-testid="login-email"]', E2E_TEST_EMAIL);
  await page.fill('[data-testid="login-password"]', E2E_TEST_PASSWORD);

  // Submit
  await page.click('[data-testid="login-submit"]');

  // Wait for redirect to admin dashboard (increased timeout for Vercel Preview cold starts)
  await page.waitForURL('**/admin**', { timeout: 60000 });
  console.log('[Auth Setup] Redirected to:', page.url());

  // Verify we're on /admin (not redirected back to /login)
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    throw new Error('[Auth Setup] Unexpectedly on login page - auth may have failed');
  }

  // Wait for DOM to be ready (auth cookies should be set)
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  console.log('[Auth Setup] DOM content loaded');

  // Wait for network to settle to ensure cookies are fully written
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  console.log('[Auth Setup] Auth state ready');

  // Save storage state
  await page.context().storageState({ path: authFile });
  console.log(`[Auth Setup] Storage state saved to ${authFile}`);
});
