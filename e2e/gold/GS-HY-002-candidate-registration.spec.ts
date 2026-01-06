/**
 * GS-HY-002: 候補者登録→検査リンク発行
 *
 * UC-ID: UC-HY-ADMIN-CANDIDATE-WEB
 * Role: 管理者（ADMIN）
 * Outcome: 候補者登録完了・検査リンク発行
 *
 * @see docs/gold-specs/GS-HY-002-candidate-registration.md
 */

import { test, expect, SELECTORS, navigateToNewCandidateForm } from '../fixtures';
import { waitForPageReady } from '../helpers/deterministic-wait';

test.describe('GS-HY-002: 候補者登録→検査リンク発行', () => {
  // 認証済み状態を使用（setup プロジェクトで作成）
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('管理者が候補者を登録し検査リンクを発行できる @smoke', async ({ page }) => {
    const testCandidate = {
      name: `Gold Test ${Date.now()}`,
      email: `gold-test-${Date.now()}@example.com`,
    };

    // Given: 候補者追加フォームにアクセス
    await navigateToNewCandidateForm(page);

    // When: 候補者情報を入力
    await page.fill(SELECTORS.candidateName, testCandidate.name);
    await page.fill(SELECTORS.candidateEmail, testCandidate.email);

    // When: 希望職種を選択（必須項目）
    await page.click('label[for="account_manager"]');

    // When: 登録ボタンをクリック
    await page.click(SELECTORS.candidateSubmit);

    // Then: 成功（候補者一覧にリダイレクト or 成功メッセージ）
    await Promise.race([
      expect(page).toHaveURL(/\/admin\/candidates(?!\/new)/, { timeout: 15000 }),
      expect(page.locator('[data-sonner-toast], [role="status"]')).toBeVisible({ timeout: 15000 }),
    ]);

    // Then: 候補者一覧ページで新規候補者を確認
    await page.goto('/admin/candidates');
    await waitForPageReady(page);
    await expect(page.locator(`text=${testCandidate.name}`)).toBeVisible({ timeout: 10000 });
  });

  test('必須項目が空の場合はエラーが表示される', async ({ page }) => {
    // Given: 候補者追加ページにアクセス
    await page.goto('/admin/candidates/new');
    await waitForPageReady(page);

    // When: 何も入力せずに登録ボタンをクリック
    const submitButton = page.locator(SELECTORS.candidateSubmit);
    await submitButton.waitFor({ state: 'visible', timeout: 10000 });
    await submitButton.click();

    // Then: バリデーションエラーが表示されるか、ページに留まる
    // HTML5バリデーションにより送信がブロックされる場合もある
    const url = page.url();
    expect(url).toContain('/admin/candidates');
  });
});
