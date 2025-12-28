// =====================================================
// Playwright Auth Setup
// Authenticate and save storage state
// =====================================================

import { test as setup, expect } from '@playwright/test';

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

  // Wait for redirect to admin dashboard
  await page.waitForURL('**/admin**', { timeout: 15000 });

  // Wait for header to load (faster than waiting for h1 in main content)
  // Header is a client component that renders immediately after layout loads
  await page.waitForSelector('header', { timeout: 10000 });

  // Wait for network to settle and page content to load
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Verify we're authenticated by checking for user menu (not login link)
  // If we see avatar instead of login link, auth is working
  const hasAvatar = await page.locator('button:has(span)').first().isVisible().catch(() => false);
  const hasLoginLink = await page.locator('a[href="/login"]:has-text("ログイン")').isVisible().catch(() => false);

  console.log(`[Auth Setup] Avatar visible: ${hasAvatar}, Login link visible: ${hasLoginLink}`);

  if (hasLoginLink && !hasAvatar) {
    console.log('[Auth Setup] WARNING: Login link visible - user profile may not exist in users table');
  }

  // Additional wait to ensure session cookies are fully set
  await page.waitForTimeout(2000);

  // Save storage state
  await page.context().storageState({ path: authFile });
  console.log(`[Auth Setup] Storage state saved to ${authFile}`);
});
