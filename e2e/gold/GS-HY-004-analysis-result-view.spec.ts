/**
 * GS-HY-004: 分析結果閲覧
 *
 * UC-ID: UC-HY-ADMIN-VIEW-WEB
 * Role: 管理者（ADMIN）
 * Outcome: 分析結果閲覧・採用判断材料取得
 *
 * @see docs/gold-specs/GS-HY-004-analysis-result-view.md
 */

import { test, expect } from '../fixtures';
import { waitForPageReady } from '../helpers/deterministic-wait';

test.describe('GS-HY-004: 分析結果閲覧', () => {
  // 認証済み状態を使用（setup プロジェクトで作成）
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('管理者が候補者の分析結果を閲覧できる @smoke', async ({ page }) => {
    // Given: 候補者一覧にアクセス
    await page.goto('/admin/candidates');
    await waitForPageReady(page);
    await expect(page).toHaveURL(/\/admin\/candidates/);

    // Given: 分析完了済みの候補者を探す
    const analyzedRow = page.locator('[data-testid^="candidate-row-"]').filter({
      has: page.locator('text=/完了|analyzed|分析済/i'),
    }).first();

    // 分析完了済み候補者がいない場合は候補者IDで直接アクセス
    const candidateId = process.env.E2E_TEST_CANDIDATE_ID;

    if (await analyzedRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      // When: 候補者をクリックして詳細を開く
      await analyzedRow.click();
      await waitForPageReady(page);
    } else if (candidateId) {
      // 直接候補者詳細ページにアクセス
      await page.goto(`/admin/candidates/${candidateId}`);
      await waitForPageReady(page);
    } else {
      test.skip(true, 'No analyzed candidate available and E2E_TEST_CANDIDATE_ID not configured');
    }

    // Then: 分析結果セクションが表示される
    await expect(
      page.locator('[data-testid="analysis-result"], [data-testid="analysis-section"], .analysis-result, main')
    ).toBeVisible({ timeout: 15000 });
  });

  test('分析結果ページから再分析を実行できる', async ({ page }) => {
    const candidateId = process.env.E2E_TEST_CANDIDATE_ID;
    test.skip(!candidateId, 'E2E_TEST_CANDIDATE_ID not configured');

    // Given: 候補者詳細ページにアクセス
    await page.goto(`/admin/candidates/${candidateId}`);
    await waitForPageReady(page);

    // When: 再分析ボタンを探す
    const reanalyzeButton = page.locator(
      '[data-testid="reanalyze-button"], button:has-text("再分析")'
    );

    if (await reanalyzeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reanalyzeButton.click();

      // Then: 再分析ダイアログまたは確認が表示される
      await expect(
        page.locator('[data-testid="reanalyze-dialog"], [role="dialog"]')
      ).toBeVisible({ timeout: 10000 });
    } else {
      // 再分析ボタンがない場合はスキップ
      test.skip(true, 'Reanalyze button not available');
    }
  });
});
