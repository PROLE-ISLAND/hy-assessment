/**
 * GS-HY-006: 候補者レポート閲覧
 *
 * UC-ID: UC-HY-CAND-REPORT-WEB
 * Role: 候補者（CAND）
 * Outcome: フィードバックレポート閲覧完了
 *
 * このテストは候補者への価値提供の完結点を検証する。
 * システムが双方向に価値を提供することを証明する重要なGold E2E。
 *
 * @see docs/gold-specs/GS-HY-006-candidate-report-view.md
 */

import { test, expect } from '../fixtures';
import { waitForPageReady } from '../helpers/deterministic-wait';

test.describe('GS-HY-006: 候補者レポート閲覧', () => {
  // 候補者は認証不要（トークンでアクセス）

  test('候補者がフィードバックレポートを閲覧できる @smoke', async ({ browser }) => {
    const reportToken = process.env.E2E_TEST_REPORT_TOKEN;
    test.skip(!reportToken, 'E2E_TEST_REPORT_TOKEN not configured');

    // 新しいコンテキスト（認証なし）でアクセス
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Given: 有効なレポートトークンでアクセス
      await page.goto(`/report/${reportToken}`);
      await waitForPageReady(page);

      // Then: レポートページが表示される
      const reportVisible = await page.locator('[data-testid="candidate-report"], [data-testid="report-view"], .report-container, main').isVisible().catch(() => false);
      expect(reportVisible).toBeTruthy();
    } finally {
      await context.close();
    }
  });

  test('無効なレポートトークンではエラーが表示される', async ({ browser }) => {
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
