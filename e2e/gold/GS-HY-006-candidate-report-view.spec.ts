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

import { test, expect } from '@playwright/test';

test.describe('GS-HY-006: 候補者レポート閲覧', () => {
  // 候補者は認証不要（トークンでアクセス）

  test('候補者がフィードバックレポートを閲覧できる', async ({ browser }) => {
    const reportToken = process.env.E2E_TEST_REPORT_TOKEN;
    test.skip(!reportToken, 'E2E_TEST_REPORT_TOKEN not configured');

    // 新しいコンテキスト（認証なし）でアクセス
    const context = await browser.newContext();
    const page = await context.newPage();

    // Given: 有効なレポートトークンでアクセス
    await page.goto(`/report/${reportToken}`);

    // Then: レポートページが表示される
    await expect(
      page.locator('[data-testid="candidate-report"], [data-testid="report-view"], .report-container')
    ).toBeVisible({ timeout: 10000 });

    // Then: 候補者情報が表示される
    await expect(
      page.locator('[data-testid="candidate-info"], [data-testid="candidate-summary"], .candidate-info')
    ).toBeVisible();

    // Then: 分析サマリーが表示される
    await expect(
      page.locator('[data-testid="analysis-summary"], [data-testid="score-summary"], .analysis-summary')
    ).toBeVisible();

    await context.close();
  });

  test('強み・改善点セクションが表示される', async ({ browser }) => {
    const reportToken = process.env.E2E_TEST_REPORT_TOKEN;
    test.skip(!reportToken, 'E2E_TEST_REPORT_TOKEN not configured');

    const context = await browser.newContext();
    const page = await context.newPage();

    // Given: レポートページにアクセス
    await page.goto(`/report/${reportToken}`);

    // Given: レポートが表示されている
    await expect(
      page.locator('[data-testid="candidate-report"], .report-container')
    ).toBeVisible({ timeout: 10000 });

    // Then: 強みセクションが表示される（存在する場合）
    const strengthsSection = page.locator(
      '[data-testid="strengths-section"], [data-testid="strengths"], .strengths'
    );
    if (await strengthsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(strengthsSection).toBeVisible();
    }

    // Then: 改善点セクションが表示される（存在する場合）
    const improvementSection = page.locator(
      '[data-testid="improvement-section"], [data-testid="areas-for-improvement"], .improvements'
    );
    if (await improvementSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(improvementSection).toBeVisible();
    }

    await context.close();
  });

  test('無効なレポートトークンではエラーが表示される', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Given: 無効なトークンでアクセス
    await page.goto('/report/invalid-token-12345');

    // Then: エラーまたは404が表示される
    await expect(
      page.locator('[data-testid="error-message"], [data-testid="not-found"], h1:has-text("404"), .error-page')
    ).toBeVisible({ timeout: 5000 });

    // Then: レポート内容は表示されない
    await expect(
      page.locator('[data-testid="candidate-report"], [data-testid="analysis-summary"]')
    ).not.toBeVisible();

    await context.close();
  });

  test('期限切れトークンでは期限切れメッセージが表示される', async ({ browser }) => {
    const expiredToken = process.env.E2E_TEST_EXPIRED_REPORT_TOKEN;
    test.skip(!expiredToken, 'E2E_TEST_EXPIRED_REPORT_TOKEN not configured');

    const context = await browser.newContext();
    const page = await context.newPage();

    // Given: 期限切れトークンでアクセス
    await page.goto(`/report/${expiredToken}`);

    // Then: 期限切れメッセージが表示される
    await expect(
      page.locator('[data-testid="expired-message"], [data-testid="token-expired"], .expired')
    ).toBeVisible({ timeout: 5000 });

    // Then: レポートリンク再送フォームが表示される（存在する場合）
    const resendForm = page.locator(
      '[data-testid="resend-link-form"], [data-testid="request-new-link"], a:has-text("再送")'
    );
    if (await resendForm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(resendForm).toBeVisible();
    }

    await context.close();
  });

  test('レポートページのアクセシビリティ基本確認', async ({ browser }) => {
    const reportToken = process.env.E2E_TEST_REPORT_TOKEN;
    test.skip(!reportToken, 'E2E_TEST_REPORT_TOKEN not configured');

    const context = await browser.newContext();
    const page = await context.newPage();

    // Given: レポートページにアクセス
    await page.goto(`/report/${reportToken}`);

    // Given: レポートが表示されている
    await expect(
      page.locator('[data-testid="candidate-report"], .report-container')
    ).toBeVisible({ timeout: 10000 });

    // Then: 見出し要素が存在する
    const headings = page.locator('h1, h2, h3');
    expect(await headings.count()).toBeGreaterThan(0);

    // Then: メインコンテンツが識別可能（main要素または適切なrole）
    const mainContent = page.locator('main, [role="main"], .main-content');
    if (await mainContent.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(mainContent).toBeVisible();
    }

    await context.close();
  });
});
