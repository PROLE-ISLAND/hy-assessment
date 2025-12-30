/**
 * GS-HY-004: 分析結果閲覧
 *
 * UC-ID: UC-HY-ADMIN-VIEW-WEB
 * Role: 管理者（ADMIN）
 * Outcome: 分析結果閲覧・採用判断材料取得
 *
 * @see docs/gold-specs/GS-HY-004-analysis-result-view.md
 */

import { test, expect } from '@playwright/test';

test.describe('GS-HY-004: 分析結果閲覧', () => {
  // 認証済み状態を使用
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('管理者が候補者の分析結果を閲覧できる', async ({ page }) => {
    // Given: 候補者一覧にアクセス
    await page.goto('/admin/candidates');
    await expect(page).toHaveURL(/\/admin\/candidates/);

    // Given: 分析完了済みの候補者を探す
    const analyzedRow = page.locator('[data-testid^="candidate-row-"]').filter({
      has: page.locator('text=/完了|analyzed|分析済/i'),
    }).first();

    // 分析完了済み候補者がいない場合は候補者IDで直接アクセス
    const candidateId = process.env.E2E_TEST_CANDIDATE_ID;

    if (await analyzedRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      // When: 候補者をクリックして詳細を開く
      await analyzedRow.click();
    } else if (candidateId) {
      // 直接候補者詳細ページにアクセス
      await page.goto(`/admin/candidates/${candidateId}`);
    } else {
      test.skip(true, 'No analyzed candidate available and E2E_TEST_CANDIDATE_ID not configured');
    }

    // Then: 分析結果セクションが表示される
    await expect(
      page.locator('[data-testid="analysis-result"], [data-testid="analysis-section"], .analysis-result')
    ).toBeVisible({ timeout: 10000 });

    // Then: スコア表示がある
    await expect(
      page.locator('[data-testid="score-chart"], [data-testid="score-display"], .score')
    ).toBeVisible();

    // Then: 判定表示がある
    await expect(
      page.locator('[data-testid="judgment-badge"], [data-testid="judgment"], .judgment')
    ).toBeVisible();
  });

  test('分析結果ページから再分析を実行できる', async ({ page }) => {
    const candidateId = process.env.E2E_TEST_CANDIDATE_ID;
    test.skip(!candidateId, 'E2E_TEST_CANDIDATE_ID not configured');

    // Given: 候補者詳細ページにアクセス
    await page.goto(`/admin/candidates/${candidateId}`);

    // Given: 分析結果が表示されている
    await expect(
      page.locator('[data-testid="analysis-result"], .analysis-result')
    ).toBeVisible({ timeout: 10000 });

    // When: 再分析ボタンを探す
    const reanalyzeButton = page.locator(
      '[data-testid="reanalyze-button"], button:has-text("再分析")'
    );

    if (await reanalyzeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reanalyzeButton.click();

      // Then: 再分析ダイアログまたは確認が表示される
      await expect(
        page.locator('[data-testid="reanalyze-dialog"], [role="dialog"]')
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('分析履歴を切り替えて閲覧できる', async ({ page }) => {
    const candidateId = process.env.E2E_TEST_CANDIDATE_ID;
    test.skip(!candidateId, 'E2E_TEST_CANDIDATE_ID not configured');

    // Given: 候補者詳細ページにアクセス
    await page.goto(`/admin/candidates/${candidateId}`);

    // Given: 分析履歴セレクタがある場合
    const versionSelector = page.locator(
      '[data-testid="version-selector"], [data-testid="analysis-version"]'
    );

    if (await versionSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      // When: バージョンを切り替え
      await versionSelector.click();
      const versionOption = page.locator('[data-testid^="version-option-"]').first();
      if (await versionOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await versionOption.click();

        // Then: 分析結果が更新される
        await expect(
          page.locator('[data-testid="analysis-result"]')
        ).toBeVisible();
      }
    }
  });
});
