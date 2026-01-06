/**
 * GS-HY-001: 管理者ログイン
 *
 * UC-ID: UC-HY-ADMIN-AUTH-WEB
 * Role: 管理者（ADMIN）
 * Outcome: 認証成功・システムアクセス
 *
 * @see docs/gold-specs/GS-HY-001-admin-login.md
 */

import { test, expect, SELECTORS } from '../fixtures';

// 環境変数から認証情報を取得
const E2E_TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'e2e-test@hy-assessment.local';
const E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'E2ETestSecure123!';

test.describe('GS-HY-001: 管理者ログイン', () => {
  // ログインテストはstorageStateを使用しない（認証フロー自体をテストするため）
  test.use({ storageState: { cookies: [], origins: [] } });
  test('管理者がログインしてダッシュボードにアクセスできる @smoke', async ({ page }) => {
    // Given: ログインページにアクセス
    await page.goto('/login');
    await expect(page.locator(SELECTORS.loginEmail)).toBeVisible({ timeout: 15000 });

    // When: 認証情報を入力
    await page.fill(SELECTORS.loginEmail, E2E_TEST_EMAIL);
    await page.fill(SELECTORS.loginPassword, E2E_TEST_PASSWORD);

    // When: ログインボタンをクリック
    await page.click(SELECTORS.loginSubmit);

    // Then: ダッシュボードにリダイレクト
    await expect(page).toHaveURL(/\/admin/, { timeout: 30000 });

    // Then: ページが表示される
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await expect(page.locator('main, [data-testid="admin-layout"]')).toBeVisible();
  });

  test('無効な認証情報でログインできない', async ({ page }) => {
    // Given: ログインページにアクセス
    await page.goto('/login');
    await expect(page.locator(SELECTORS.loginEmail)).toBeVisible({ timeout: 15000 });

    // When: 無効な認証情報を入力
    await page.fill(SELECTORS.loginEmail, 'invalid@example.com');
    await page.fill(SELECTORS.loginPassword, 'wrongpassword');
    await page.click(SELECTORS.loginSubmit);

    // Then: ネットワーク完了を待つ
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Then: エラーメッセージが表示されるか、ログインページに留まる
    const hasError = await page.locator(SELECTORS.loginError).isVisible().catch(() => false) ||
      await page.locator('[role="alert"], .text-destructive').isVisible().catch(() => false);
    const onLoginPage = page.url().includes('/login');

    expect(hasError || onLoginPage).toBeTruthy();
  });
});
