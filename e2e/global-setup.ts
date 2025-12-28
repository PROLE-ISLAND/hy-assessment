// =====================================================
// Playwright Global Setup
// Authenticate once and save state for all tests
// =====================================================

import { chromium, FullConfig } from '@playwright/test';

const E2E_TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'e2e-test@hy-assessment.local';
const E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'E2ETestSecure123!';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('[Global Setup] Starting authentication...');

  try {
    // Navigate to login page
    await page.goto(`${baseURL}/login`);

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
    await page.waitForSelector('header', { timeout: 10000 });

    // Wait for network to settle and session cookies to be set
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    console.log('[Global Setup] Authentication successful!');

    // Save storage state (cookies, localStorage, etc.)
    await context.storageState({ path: './e2e/.auth/user.json' });

    console.log('[Global Setup] Storage state saved to e2e/.auth/user.json');
  } catch (error) {
    console.error('[Global Setup] Authentication failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
