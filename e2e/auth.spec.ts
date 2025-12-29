// =====================================================
// E2E Tests: Authentication Flow
// =====================================================

import { test, expect, SELECTORS } from './fixtures';

test.describe('Authentication', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/admin');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');

    // Check for login form elements using data-testid
    // Note: "管理者ログイン" is not a heading element, so we check for the text
    await expect(page.getByText('管理者ログイン')).toBeVisible();
    await expect(page.locator(SELECTORS.loginEmail)).toBeVisible();
    await expect(page.locator(SELECTORS.loginPassword)).toBeVisible();
    await expect(page.locator(SELECTORS.loginSubmit)).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Enter invalid credentials using data-testid
    await page.fill(SELECTORS.loginEmail, 'invalid@example.com');
    await page.fill(SELECTORS.loginPassword, 'wrongpassword');
    await page.click(SELECTORS.loginSubmit);

    // Wait for error to appear (network request to complete)
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Should show error message (check for error element or text)
    const hasError = await page.locator(SELECTORS.loginError).isVisible().catch(() => false);
    const hasErrorText = await page.getByText(/エラー|失敗|正しくありません/i).isVisible().catch(() => false);
    expect(hasError || hasErrorText).toBeTruthy();
  });

  test('validates email format', async ({ page }) => {
    await page.goto('/login');

    // Enter invalid email
    const emailInput = page.locator(SELECTORS.loginEmail);
    await emailInput.fill('notanemail');
    await page.locator(SELECTORS.loginPassword).click(); // Blur email field

    // HTML5 validation should prevent form submission
    await expect(emailInput).toHaveAttribute('type', 'email');
  });
});
