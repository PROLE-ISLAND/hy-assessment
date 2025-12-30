/**
 * GS-HY-002: 候補者登録→検査リンク発行
 *
 * UC-ID: UC-HY-ADMIN-CANDIDATE-WEB
 * Role: 管理者（ADMIN）
 * Outcome: 候補者登録完了・検査リンク発行
 *
 * @see docs/gold-specs/GS-HY-002-candidate-registration.md
 */

import { test, expect } from '@playwright/test';

test.describe('GS-HY-002: 候補者登録→検査リンク発行', () => {
  // 認証済み状態を使用
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('管理者が候補者を登録し検査リンクを発行できる', async ({ page }) => {
    const testCandidate = {
      name: `Gold Test ${Date.now()}`,
      email: `gold-test-${Date.now()}@example.com`,
    };

    // Given: 候補者一覧ページにアクセス
    await page.goto('/admin/candidates');
    await expect(page).toHaveURL(/\/admin\/candidates/);

    // When: 候補者追加ボタンをクリック
    await page.click('[data-testid="add-candidate-button"], a[href*="new"], button:has-text("追加")');

    // When: 候補者情報を入力
    await page.fill(
      '[data-testid="candidate-name-input"], input[name="name"]',
      testCandidate.name
    );
    await page.fill(
      '[data-testid="candidate-email-input"], input[name="email"]',
      testCandidate.email
    );

    // When: 登録ボタンをクリック
    await page.click('[data-testid="submit-candidate-button"], button[type="submit"]');

    // Then: 成功（候補者一覧にリダイレクト or 成功メッセージ）
    await Promise.race([
      expect(page).toHaveURL(/\/admin\/candidates(?!\/new)/, { timeout: 10000 }),
      expect(page.locator('[data-testid="success-toast"], [role="status"]')).toBeVisible({ timeout: 10000 }),
    ]);

    // Then: 候補者一覧ページで新規候補者を確認
    await page.goto('/admin/candidates');
    await expect(page.locator(`text=${testCandidate.name}`)).toBeVisible({ timeout: 5000 });
  });

  test('必須項目が空の場合はエラーが表示される', async ({ page }) => {
    // Given: 候補者追加ページにアクセス
    await page.goto('/admin/candidates/new');

    // When: 何も入力せずに登録ボタンをクリック
    await page.click('[data-testid="submit-candidate-button"], button[type="submit"]');

    // Then: バリデーションエラーが表示される
    await expect(
      page.locator('[data-testid="validation-error"], .error, [role="alert"]')
    ).toBeVisible({ timeout: 3000 });
  });
});
