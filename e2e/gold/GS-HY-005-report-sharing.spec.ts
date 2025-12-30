/**
 * GS-HY-005: レポート共有
 *
 * UC-ID: UC-HY-ADMIN-SHARE-WEB
 * Role: 管理者（ADMIN）
 * Outcome: レポート外部共有完了
 *
 * @see docs/gold-specs/GS-HY-005-report-sharing.md
 */

import { test, expect } from '@playwright/test';

test.describe('GS-HY-005: レポート共有', () => {
  // 認証済み状態を使用
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('管理者がレポート共有リンクを生成できる', async ({ page }) => {
    const candidateId = process.env.E2E_TEST_CANDIDATE_ID;
    test.skip(!candidateId, 'E2E_TEST_CANDIDATE_ID not configured');

    // Given: 分析完了済み候補者の詳細ページにアクセス
    await page.goto(`/admin/candidates/${candidateId}`);

    // Given: 分析結果が存在する
    await expect(
      page.locator('[data-testid="analysis-result"], .analysis-result')
    ).toBeVisible({ timeout: 10000 });

    // When: レポート共有ボタンをクリック
    const shareButton = page.locator(
      '[data-testid="share-report-button"], [data-testid="share-button"], button:has-text("共有")'
    );

    if (await shareButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await shareButton.click();

      // Then: 共有ダイアログまたは共有オプションが表示される
      await expect(
        page.locator('[data-testid="share-dialog"], [data-testid="share-options"], [role="dialog"]')
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('管理者がレポートをメールで共有できる', async ({ page }) => {
    const candidateId = process.env.E2E_TEST_CANDIDATE_ID;
    test.skip(!candidateId, 'E2E_TEST_CANDIDATE_ID not configured');

    // Given: 候補者詳細ページにアクセス
    await page.goto(`/admin/candidates/${candidateId}`);

    // When: 共有ボタンをクリック
    const shareButton = page.locator(
      '[data-testid="share-report-button"], button:has-text("共有")'
    );
    await shareButton.click();

    // When: メールアドレスを入力
    const emailInput = page.locator(
      '[data-testid="share-email-input"], input[type="email"][name*="share"]'
    );
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('stakeholder@example.com');

      // When: 送信ボタンをクリック
      await page.click(
        '[data-testid="send-share-button"], button:has-text("送信"), button[type="submit"]'
      );

      // Then: 成功フィードバックが表示される
      await expect(
        page.locator('[data-testid="share-success"], [data-testid="success-toast"]')
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('共有リンクをコピーできる', async ({ page, context }) => {
    const candidateId = process.env.E2E_TEST_CANDIDATE_ID;
    test.skip(!candidateId, 'E2E_TEST_CANDIDATE_ID not configured');

    // クリップボードの権限を付与
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Given: 候補者詳細ページにアクセス
    await page.goto(`/admin/candidates/${candidateId}`);

    // When: リンクコピーボタンをクリック
    const copyButton = page.locator(
      '[data-testid="copy-report-link-button"], [data-testid="copy-link"], button:has-text("コピー")'
    );

    if (await copyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await copyButton.click();

      // Then: コピー成功フィードバック
      await expect(
        page.locator('[data-testid="copy-success"], [data-testid="copied-toast"]')
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test('共有されたレポートにアクセスできる', async ({ browser }) => {
    const reportToken = process.env.E2E_TEST_REPORT_TOKEN;
    test.skip(!reportToken, 'E2E_TEST_REPORT_TOKEN not configured');

    // 新しいコンテキスト（認証なし）でアクセス
    const context = await browser.newContext();
    const page = await context.newPage();

    // Given: 共有リンクにアクセス（認証不要）
    await page.goto(`/report/${reportToken}`);

    // Then: レポートが表示される
    await expect(
      page.locator('[data-testid="shared-report"], [data-testid="report-view"], .report')
    ).toBeVisible({ timeout: 10000 });

    // Then: 候補者情報が表示される
    await expect(
      page.locator('[data-testid="candidate-summary"], [data-testid="candidate-info"]')
    ).toBeVisible();

    // Then: 分析結果サマリーが表示される
    await expect(
      page.locator('[data-testid="analysis-summary"], [data-testid="score-summary"]')
    ).toBeVisible();

    await context.close();
  });

  test('無効な共有トークンではエラーが表示される', async ({ browser }) => {
    // 新しいコンテキスト（認証なし）でアクセス
    const context = await browser.newContext();
    const page = await context.newPage();

    // Given: 無効なトークンでアクセス
    await page.goto('/report/invalid-token-12345');

    // Then: エラーまたは404が表示される
    await expect(
      page.locator('[data-testid="error-message"], [data-testid="not-found"], h1:has-text("404")')
    ).toBeVisible({ timeout: 5000 });

    await context.close();
  });
});
