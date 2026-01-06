/**
 * GS-HY-003: 検査回答→完了
 *
 * UC-ID: UC-HY-CAND-RESPONSE-WEB
 * Role: 候補者（CAND）
 * Outcome: 回答データ保存・検査完了
 *
 * @see docs/gold-specs/GS-HY-003-assessment-completion.md
 */

import { test, expect } from '../fixtures';
import { waitForPageReady } from '../helpers/deterministic-wait';

test.describe('GS-HY-003: 検査回答→完了', () => {
  // 候補者は認証不要（トークンでアクセス）

  test('候補者が検査に回答し完了できる @smoke', async ({ page }) => {
    const assessmentToken = process.env.E2E_TEST_ASSESSMENT_TOKEN;
    test.skip(!assessmentToken, 'E2E_TEST_ASSESSMENT_TOKEN not configured');

    // Given: 検査ページにアクセス
    await page.goto(`/assessment/${assessmentToken}`);
    await waitForPageReady(page);

    // Given: 候補者情報フォームが表示された場合は入力
    const candidateInfoForm = page.locator('[data-testid="candidate-info-form"], form');
    if (await candidateInfoForm.isVisible({ timeout: 3000 }).catch(() => false)) {
      const nameInput = page.locator('[data-testid="candidate-name"], input[name="name"]');
      if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nameInput.fill('Gold Test Candidate');
      }
      const startButton = page.locator('[data-testid="start-assessment-button"], button[type="submit"]');
      if (await startButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await startButton.click();
        await waitForPageReady(page);
      }
    }

    // Given: 検査フォームが表示される
    const surveyContainer = page.locator('.sv-root-modern, [data-testid="survey-container"], .survey-container');
    await expect(surveyContainer).toBeVisible({ timeout: 15000 });

    // When: 全設問に回答（最小限の回答で進む）
    let hasNextButton = true;
    let attempts = 0;
    const maxAttempts = 50; // 無限ループ防止

    while (hasNextButton && attempts < maxAttempts) {
      attempts++;

      // 現在のページで回答可能な設問に回答
      const radioButtons = page.locator('input[type="radio"]:not(:checked)');
      if (await radioButtons.count() > 0) {
        await radioButtons.first().click();
      }

      const checkboxes = page.locator('input[type="checkbox"]:not(:checked)');
      if (await checkboxes.count() > 0) {
        await checkboxes.first().click();
      }

      // 次へボタンがあればクリック
      const nextButton = page.locator(
        '[data-testid="next-button"], .sv-btn--navigation-next, button:has-text("次へ")'
      );

      if (await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nextButton.click();
        await waitForPageReady(page);
      } else {
        hasNextButton = false;
      }
    }

    // When: 検査を完了
    const completeButton = page.locator(
      '[data-testid="complete-button"], .sv-btn--complete, button:has-text("完了"), button:has-text("送信")'
    );
    if (await completeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await completeButton.click();
    }

    // Then: 完了画面が表示される
    await expect(
      page.locator('[data-testid="assessment-complete"], [data-testid="completion-message"], .completion')
    ).toBeVisible({ timeout: 15000 });
  });

  test('無効なトークンではエラーが表示される', async ({ page }) => {
    // Given: 無効なトークンでアクセス
    await page.goto('/assessment/invalid-token-12345');
    await waitForPageReady(page);

    // Then: エラーまたは404が表示される
    const hasError = await page.locator('[data-testid="error-message"], [data-testid="not-found"]').isVisible().catch(() => false) ||
      await page.locator('h1:has-text("404")').isVisible().catch(() => false) ||
      await page.locator('text=/not found|エラー|見つかりません/i').isVisible().catch(() => false);

    expect(hasError).toBeTruthy();
  });
});
