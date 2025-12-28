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

  // Wait for redirect to admin dashboard (increased timeout for Vercel Preview)
  await page.waitForURL('**/admin**', { timeout: 30000 });
  console.log('[Auth Setup] Redirected to:', page.url());

  // Wait for page to stabilize - DOM first, then network
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  console.log('[Auth Setup] DOM content loaded');

  await page.waitForLoadState('networkidle', { timeout: 60000 });
  console.log('[Auth Setup] Network idle');

  // Now check if we're actually on admin (not redirected back to login)
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    throw new Error('[Auth Setup] Unexpectedly on login page - auth may have failed');
  }

  // Wait for any visible content (header or main content)
  await page.waitForSelector('header, main, h1', { timeout: 30000 });
  console.log('[Auth Setup] Page content visible');

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
