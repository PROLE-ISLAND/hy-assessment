/**
 * GS-HY-001: 管理者ログイン
 *
 * UC-ID: UC-HY-ADMIN-AUTH-WEB
 * Role: 管理者（ADMIN）
 * Outcome: 認証成功・システムアクセス
 *
 * @see docs/gold-specs/GS-HY-001-admin-login.md
 */

import { test, expect } from '@playwright/test';

test.describe('GS-HY-001: 管理者ログイン', () => {
  test('管理者がログインしてダッシュボードにアクセスできる', async ({ page }) => {
    // Given: ログインページにアクセス
    await page.goto('/login');
    await expect(page.locator('[data-testid="login-form"], form')).toBeVisible();

    // When: 認証情報を入力
    await page.fill(
      '[data-testid="email-input"], input[type="email"], input[name="email"]',
      process.env.E2E_TEST_EMAIL!
    );
    await page.fill(
      '[data-testid="password-input"], input[type="password"], input[name="password"]',
      process.env.E2E_TEST_PASSWORD!
    );

    // When: ログインボタンをクリック
    await page.click('[data-testid="login-button"], button[type="submit"]');

    // Then: ダッシュボードにリダイレクト
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });

    // Then: ダッシュボードが表示される
    await expect(
      page.locator('[data-testid="dashboard"], [data-testid="admin-layout"], main')
    ).toBeVisible();
  });

  test('無効な認証情報でログインできない', async ({ page }) => {
    // Given: ログインページにアクセス
    await page.goto('/login');

    // When: 無効な認証情報を入力
    await page.fill(
      '[data-testid="email-input"], input[type="email"], input[name="email"]',
      'invalid@example.com'
    );
    await page.fill(
      '[data-testid="password-input"], input[type="password"], input[name="password"]',
      'wrongpassword'
    );
    await page.click('[data-testid="login-button"], button[type="submit"]');

    // Then: エラーメッセージが表示される
    await expect(
      page.locator('[data-testid="login-error"], [role="alert"], .error')
    ).toBeVisible({ timeout: 5000 });

    // Then: ログインページに留まる
    await expect(page).toHaveURL(/\/login/);
  });
});
