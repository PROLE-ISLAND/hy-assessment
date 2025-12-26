// =====================================================
// E2E Test Fixtures and Utilities
// Common test setup for HY Assessment
// =====================================================

import { test as base, expect, type Page } from '@playwright/test';

// Get test credentials from environment variables
const E2E_TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'e2e-test@hy-assessment.local';
const E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'E2ETestSecure123!';

// Extend base test with authentication
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use: (page: Page) => Promise<void>) => {
    // Login with test credentials
    await page.goto('/login');

    // Wait for login form to be ready
    await page.waitForSelector('[data-testid="login-email"]', { timeout: 10000 });

    // Fill login form using data-testid selectors
    await page.fill('[data-testid="login-email"]', E2E_TEST_EMAIL);
    await page.fill('[data-testid="login-password"]', E2E_TEST_PASSWORD);

    // Click login button
    await page.click('[data-testid="login-submit"]');

    // Wait for redirect to admin dashboard
    await page.waitForURL('/admin**', { timeout: 15000 });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect };

// Test data constants
export const TEST_CANDIDATE = {
  name: 'E2E Test User',
  email: `e2e-test-${Date.now()}@example.com`,
  position: 'エンジニア',
};

// Common selectors using data-testid where available
export const SELECTORS = {
  // Navigation (using data-testid)
  navDashboard: '[data-testid="nav-dashboard"]',
  navCandidates: '[data-testid="nav-candidates"]',
  navCompare: '[data-testid="nav-compare"]',
  navReports: '[data-testid="nav-reports"]',
  navTemplates: '[data-testid="nav-templates"]',
  navPrompts: '[data-testid="nav-prompts"]',
  navSettings: '[data-testid="nav-settings"]',

  // Login
  loginEmail: '[data-testid="login-email"]',
  loginPassword: '[data-testid="login-password"]',
  loginSubmit: '[data-testid="login-submit"]',
  loginError: '[data-testid="login-error"]',

  // Candidates
  addCandidateButton: '[data-testid="add-candidate-button"]',
  candidateName: '[data-testid="candidate-name"]',
  candidateEmail: '[data-testid="candidate-email"]',
  candidateSubmit: '[data-testid="candidate-submit"]',
  candidateCancel: '[data-testid="candidate-cancel"]',
  selectAllButton: '[data-testid="select-all-button"]',
  compareButton: '[data-testid="compare-button"]',

  // Prompts
  promptCreateButton: '[data-testid="prompt-create-button"]',

  // Compare
  comparePositionFilter: '[data-testid="compare-position-filter"]',
  compareSelectAllButton: '[data-testid="compare-select-all-button"]',

  // Dialogs
  dialog: '[role="dialog"]',
  dialogConfirm: '[role="dialog"] button:has-text("確認")',
  dialogCancel: '[role="dialog"] button:has-text("キャンセル")',

  // Forms
  inputEmail: 'input[type="email"]',
  inputText: 'input[type="text"]',
  checkbox: '[role="checkbox"]',
  select: '[role="combobox"]',

  // Tables
  tableRow: 'tbody tr',
  tableCell: 'td',

  // Status indicators
  loading: '[data-loading="true"], .animate-spin',
  toast: '[data-sonner-toast], [role="alert"]',
};

// Helper functions
export async function waitForToast(page: Page) {
  return page.waitForSelector(SELECTORS.toast, { timeout: 5000 });
}

export async function clickAndWaitForNavigation(
  page: Page,
  selector: string
) {
  await Promise.all([
    page.waitForURL(/.*/, { timeout: 10000 }),
    page.click(selector),
  ]);
}

// Navigate to new candidate form through direct navigation
// With global-setup storage state, authentication should persist
export async function navigateToNewCandidateForm(page: Page) {
  // Go to candidates list first
  await page.goto('/admin/candidates');
  await page.waitForURL(/\/admin\/candidates/, { timeout: 10000 });

  // Wait for page to fully load
  await page.waitForSelector('h1', { timeout: 10000 });

  // Wait for the Add Candidate button to appear
  const addButton = page.locator(SELECTORS.addCandidateButton);
  await addButton.waitFor({ state: 'visible', timeout: 10000 });

  // Click add button and wait for form
  await addButton.click();
  await page.waitForURL(/\/admin\/candidates\/new/, { timeout: 10000 });

  // Wait for form to be visible
  await page.waitForSelector(SELECTORS.candidateName, { timeout: 10000 });
}

export async function login(page: Page, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await page.goto('/login');
      await page.waitForSelector(SELECTORS.loginEmail, { timeout: 10000 });
      await page.fill(SELECTORS.loginEmail, E2E_TEST_EMAIL);
      await page.fill(SELECTORS.loginPassword, E2E_TEST_PASSWORD);
      await page.click(SELECTORS.loginSubmit);
      await page.waitForURL('/admin**', { timeout: 15000 });

      // Wait for dashboard content to fully load (session established)
      await page.waitForSelector('h1', { timeout: 10000 });

      // Small delay to ensure auth cookies are fully set
      await page.waitForTimeout(500);

      return; // Success
    } catch (error) {
      if (attempt < retries) {
        // Wait before retrying (exponential backoff)
        await page.waitForTimeout(2000 * attempt);
        continue;
      }
      throw error;
    }
  }
}
