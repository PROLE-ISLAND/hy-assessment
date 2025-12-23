// =====================================================
// E2E Tests: Authentication Flow
// =====================================================

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/admin');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');

    // Check for login form elements
    await expect(page.getByRole('heading', { name: /ログイン/i })).toBeVisible();
    await expect(page.getByLabel(/メールアドレス/i)).toBeVisible();
    await expect(page.getByLabel(/パスワード/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /ログイン/i })).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Enter invalid credentials
    await page.getByLabel(/メールアドレス/i).fill('invalid@example.com');
    await page.getByLabel(/パスワード/i).fill('wrongpassword');
    await page.getByRole('button', { name: /ログイン/i }).click();

    // Should show error message
    await expect(page.getByText(/メールアドレスまたはパスワードが正しくありません/i)).toBeVisible();
  });

  test('validates email format', async ({ page }) => {
    await page.goto('/login');

    // Enter invalid email
    const emailInput = page.getByLabel(/メールアドレス/i);
    await emailInput.fill('notanemail');
    await page.getByLabel(/パスワード/i).click(); // Blur email field

    // HTML5 validation should prevent form submission
    await expect(emailInput).toHaveAttribute('type', 'email');
  });
});
