// =====================================================
// Public Pages E2E Tests
// Test assessment form, candidate report (no auth required)
// =====================================================

import { test, expect, SELECTORS, login } from './fixtures';

test.describe('Public Pages', () => {
  test.describe('Assessment Form Page', () => {
    test('should show 404 or error for invalid token', async ({ page }) => {
      await page.goto('/assessment/invalid-token-12345');
      await page.waitForTimeout(2000);

      const hasError = await page.getByText('見つかりません').isVisible().catch(() => false);
      const has404 = await page.getByText('404').isVisible().catch(() => false);
      const hasInvalid = await page.getByText('無効').isVisible().catch(() => false);
      const hasExpired = await page.getByText('期限').isVisible().catch(() => false);

      expect(hasError || has404 || hasInvalid || hasExpired).toBeTruthy();
    });

    test('should not require login for assessment page', async ({ page }) => {
      await page.goto('/assessment/test-token');
      await page.waitForTimeout(2000);

      expect(page.url()).not.toContain('/login');
    });
  });

  test.describe('Candidate Report Page', () => {
    test('should show error for invalid report token', async ({ page }) => {
      await page.goto('/report/invalid-report-token-12345');
      await page.waitForTimeout(2000);

      const hasError = await page.getByText('見つかりません').isVisible().catch(() => false);
      const has404 = await page.getByText('404').isVisible().catch(() => false);
      const hasInvalid = await page.getByText('無効').isVisible().catch(() => false);
      const hasExpired = await page.getByText('期限').isVisible().catch(() => false);

      expect(hasError || has404 || hasInvalid || hasExpired).toBeTruthy();
    });

    test('should not require login for report page', async ({ page }) => {
      await page.goto('/report/test-token');
      await page.waitForTimeout(2000);

      expect(page.url()).not.toContain('/login');
    });
  });

  test.describe('Login Page (Public)', () => {
    test('should be accessible without authentication', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should have email and password inputs with data-testid', async ({ page }) => {
      await page.goto('/login');

      await expect(page.locator(SELECTORS.loginEmail)).toBeVisible();
      await expect(page.locator(SELECTORS.loginPassword)).toBeVisible();
    });

    test('should have login button with data-testid', async ({ page }) => {
      await page.goto('/login');

      const loginButton = page.locator(SELECTORS.loginSubmit);
      await expect(loginButton).toBeVisible();
      await expect(loginButton).toBeEnabled();
    });
  });
});
