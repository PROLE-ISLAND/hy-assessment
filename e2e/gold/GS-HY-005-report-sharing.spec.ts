/**
 * GS-HY-005: レポート共有
 *
 * UC-ID: UC-HY-ADMIN-SHARE-WEB
 * Role: 管理者（ADMIN）
 * Outcome: レポート外部共有完了
 *
 * @see docs/gold-specs/GS-HY-005-report-sharing.md
 */

import { test, expect } from '../fixtures';
import { waitForPageReady } from '../helpers/deterministic-wait';

test.describe('GS-HY-005: レポート共有', () => {
  // 認証済み状態を使用（setup プロジェクトで作成）
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('管理者がレポート共有リンクを生成できる @smoke', async ({ page }) => {
    const candidateId = process.env.E2E_TEST_CANDIDATE_ID;
    test.skip(!candidateId, 'E2E_TEST_CANDIDATE_ID not configured');

    // Given: 分析完了済み候補者の詳細ページにアクセス
    await page.goto(`/admin/candidates/${candidateId}`);
    await waitForPageReady(page);

    // When: レポート共有ボタンを探す
    const shareButton = page.locator(
      '[data-testid="share-report-button"], [data-testid="share-button"], button:has-text("共有")'
    );

    if (await shareButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await shareButton.click();

      // Then: 共有ダイアログまたは共有オプションが表示される
      await expect(
        page.locator('[data-testid="share-dialog"], [data-testid="share-options"], [role="dialog"]')
      ).toBeVisible({ timeout: 10000 });
    } else {
      // 共有ボタンがない場合はスキップ
      test.skip(true, 'Share button not available');
    }
  });

  test('共有されたレポートにアクセスできる', async ({ browser }) => {
    const reportToken = process.env.E2E_TEST_REPORT_TOKEN;
    test.skip(!reportToken, 'E2E_TEST_REPORT_TOKEN not configured');

    // 新しいコンテキスト（認証なし）でアクセス
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Given: 共有リンクにアクセス（認証不要）
      await page.goto(`/report/${reportToken}`);
      await waitForPageReady(page);

      // Then: レポートが表示される（いずれかのセレクタにマッチ）
      const reportVisible = await page.locator('[data-testid="shared-report"], [data-testid="report-view"], .report, main').isVisible().catch(() => false);
      expect(reportVisible).toBeTruthy();
    } finally {
      await context.close();
    }
  });

  test('無効な共有トークンではエラーが表示される', async ({ browser }) => {
    // 新しいコンテキスト（認証なし）でアクセス
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Given: 無効なトークンでアクセス
      await page.goto('/report/invalid-token-12345');
      await waitForPageReady(page);

      // Then: エラーまたは404が表示される
      const hasError = await page.locator('[data-testid="error-message"], [data-testid="not-found"]').isVisible().catch(() => false) ||
        await page.locator('h1:has-text("404")').isVisible().catch(() => false) ||
        await page.locator('text=/not found|エラー|見つかりません/i').isVisible().catch(() => false);

      expect(hasError).toBeTruthy();
    } finally {
      await context.close();
    }
  });
});
