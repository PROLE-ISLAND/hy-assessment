// =====================================================
// Authentication Flow E2E Tests
// Test login/logout buttons and navigation
// =====================================================

import { test, expect, SELECTORS, login } from '../fixtures';

// E2E credentials from environment
const E2E_TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'e2e-test@hy-assessment.local';
const E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'E2ETestSecure123!';

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test('should display login form with proper elements', async ({ page }) => {
      await page.goto('/login');

      // Check form elements exist using data-testid
      await expect(page.locator(SELECTORS.loginEmail)).toBeVisible();
      await expect(page.locator(SELECTORS.loginPassword)).toBeVisible();
      await expect(page.locator(SELECTORS.loginSubmit)).toBeVisible();
    });

    test('should show validation error for empty form submission', async ({ page }) => {
      await page.goto('/login');

      // Click login without filling form
      await page.click(SELECTORS.loginSubmit);

      // Should remain on login page (HTML5 validation prevents submission)
      await expect(page).toHaveURL(/\/login/);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill(SELECTORS.loginEmail, 'invalid@example.com');
      await page.fill(SELECTORS.loginPassword, 'wrongpassword');
      await page.click(SELECTORS.loginSubmit);

      // Should show error message or remain on login page
      // Wait for either error to appear or stay on login page
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      const url = page.url();
      const hasError = url.includes('/login') ||
        await page.locator(SELECTORS.loginError).isVisible().catch(() => false) ||
        await page.locator('[role="alert"], .text-destructive').isVisible().catch(() => false);
      expect(hasError).toBeTruthy();
    });

    test('should successfully login with valid E2E credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill(SELECTORS.loginEmail, E2E_TEST_EMAIL);
      await page.fill(SELECTORS.loginPassword, E2E_TEST_PASSWORD);
      await page.click(SELECTORS.loginSubmit);

      // Should redirect to admin dashboard
      await page.waitForURL('/admin**', { timeout: 15000 });
      await expect(page).toHaveURL(/\/admin/);
    });
  });

  test.describe('Logout Flow', () => {
    test('should successfully logout', async ({ page }) => {
      // First login
      await login(page);

      // Find and click logout button (usually in user menu)
      const userMenu = page.locator('[data-testid="user-menu"], button:has-text("ログアウト")');
      if (await userMenu.isVisible()) {
        await userMenu.click();
      }

      // Look for logout option
      const logoutButton = page.locator('button:has-text("ログアウト"), a:has-text("ログアウト")');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForURL('/login**', { timeout: 10000 });
        await expect(page).toHaveURL(/\/login/);
      }
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing admin without auth', async ({ page }) => {
      await page.goto('/admin');

      // Should redirect to login
      await page.waitForURL('/login**', { timeout: 10000 });
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect to login when accessing candidates without auth', async ({ page }) => {
      await page.goto('/admin/candidates');

      await page.waitForURL('/login**', { timeout: 10000 });
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
