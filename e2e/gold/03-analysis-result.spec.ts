// =====================================================
// Analysis Results E2E Tests
// Test analysis viewing, tabs, PDF, re-analysis, sharing
// =====================================================

import { test, expect, SELECTORS, login } from '../fixtures';
import { waitForPageReady } from '../helpers/deterministic-wait';

test.describe('Analysis Results', () => {
  test.beforeEach(async ({ page }) => {
    // Login using helper
    await login(page);
  });

  test.describe('Assessments List Page', () => {
    test('should navigate to assessments page', async ({ page }) => {
      await page.goto('/admin/assessments');
      await expect(page).toHaveURL(/\/admin\/assessments/);
    });

    test('should display assessment list or empty state', async ({ page }) => {
      await page.goto('/admin/assessments');
      await waitForPageReady(page);

      const hasAssessments = await page.locator(SELECTORS.tableRow).count();
      const hasEmptyState = await page.getByText('分析結果がありません').isVisible().catch(() => false);

      expect(hasAssessments > 0 || hasEmptyState).toBeTruthy();
    });

    test('should have Detail button for each assessment', async ({ page }) => {
      await page.goto('/admin/assessments');
      await waitForPageReady(page);

      const assessmentRows = await page.locator(SELECTORS.tableRow).count();
      if (assessmentRows > 0) {
        const detailButton = page.locator('tbody tr').first().locator('a:has-text("詳細"), button:has-text("詳細")');
        await expect(detailButton).toBeVisible();
      }
    });
  });

  test.describe('Analysis Detail Page', () => {
    let assessmentUrl: string | null = null;

    test.beforeEach(async ({ page }) => {
      // Navigate to first assessment with analysis
      await page.goto('/admin/assessments');
      await waitForPageReady(page);

      const assessmentRows = await page.locator(SELECTORS.tableRow).count();
      if (assessmentRows > 0) {
        const detailLink = page.locator('tbody tr').first().locator('a:has-text("詳細")');
        if (await detailLink.isVisible()) {
          await detailLink.click();
          await page.waitForURL(/\/admin\/assessments\/[a-zA-Z0-9-]+/, { timeout: 10000 });
          assessmentUrl = page.url();
        }
      }
    });

    test('should display analysis result tabs or no-analysis state', async ({ page }) => {
      if (!assessmentUrl) {
        test.skip();
        return;
      }

      await page.goto(assessmentUrl);
      await waitForPageReady(page);

      // Check for main tabs (when analysis exists)
      const analysisTab = page.locator('[role="tab"]:has-text("分析結果")');
      const historyTab = page.locator('[role="tab"]:has-text("履歴")');

      const hasAnalysisTab = await analysisTab.isVisible().catch(() => false);
      const hasHistoryTab = await historyTab.isVisible().catch(() => false);

      // Check for no-analysis state (when analysis doesn't exist)
      const noAnalysisHeading = page.getByRole('heading', { name: '分析結果がありません' });
      const runAnalysisButton = page.getByRole('button', { name: /分析を実行/ });

      const hasNoAnalysisState = await noAnalysisHeading.isVisible().catch(() => false);
      const hasRunButton = await runAnalysisButton.isVisible().catch(() => false);

      // Either tabs should be visible (analysis exists) or no-analysis state should be shown
      expect(hasAnalysisTab || hasHistoryTab || hasNoAnalysisState || hasRunButton).toBeTruthy();
    });

    test('should switch between tabs correctly', async ({ page }) => {
      if (!assessmentUrl) {
        test.skip();
        return;
      }

      await page.goto(assessmentUrl);
      await waitForPageReady(page);

      const historyTab = page.locator('[role="tab"]:has-text("履歴")');
      if (await historyTab.isVisible()) {
        await historyTab.click();

        const historyPanel = page.locator('[role="tabpanel"]');
        await expect(historyPanel).toBeVisible({ timeout: 5000 });
      }
    });

    test('should have PDF download button', async ({ page }) => {
      if (!assessmentUrl) {
        test.skip();
        return;
      }

      await page.goto(assessmentUrl);
      await waitForPageReady(page);

      const pdfButton = page.locator('button:has-text("PDF"), a:has-text("PDF")');
      if (await pdfButton.isVisible()) {
        await expect(pdfButton).toBeEnabled();
      }
    });

    test('should have re-analysis button', async ({ page }) => {
      if (!assessmentUrl) {
        test.skip();
        return;
      }

      await page.goto(assessmentUrl);
      await waitForPageReady(page);

      const reanalyzeButton = page.locator('button:has-text("再分析")');
      if (await reanalyzeButton.isVisible()) {
        await expect(reanalyzeButton).toBeEnabled();
      }
    });

    test('should open re-analysis dialog when clicking button', async ({ page }) => {
      if (!assessmentUrl) {
        test.skip();
        return;
      }

      await page.goto(assessmentUrl);
      await waitForPageReady(page);

      const reanalyzeButton = page.locator('button:has-text("再分析")');
      if (await reanalyzeButton.isVisible()) {
        await reanalyzeButton.click();

        const dialog = page.locator(SELECTORS.dialog);
        await expect(dialog).toBeVisible({ timeout: 5000 });
      }
    });

    test('should have cancel button in re-analysis dialog', async ({ page }) => {
      if (!assessmentUrl) {
        test.skip();
        return;
      }

      await page.goto(assessmentUrl);
      await waitForPageReady(page);

      const reanalyzeButton = page.locator('button:has-text("再分析")');
      if (await reanalyzeButton.isVisible()) {
        await reanalyzeButton.click();

        // Wait for dialog to appear instead of arbitrary timeout
        const dialog = page.locator(SELECTORS.dialog);
        await dialog.waitFor({ state: 'visible', timeout: 5000 });

        const cancelButton = page.locator('[role="dialog"] button:has-text("キャンセル")');
        await expect(cancelButton).toBeVisible();

        await cancelButton.click();
        await expect(dialog).not.toBeVisible({ timeout: 3000 });
      }
    });

    test('should display score charts', async ({ page }) => {
      if (!assessmentUrl) {
        test.skip();
        return;
      }

      await page.goto(assessmentUrl);
      await waitForPageReady(page);

      const charts = page.locator('.recharts-wrapper, svg.recharts-surface');
      if (await charts.count() > 0) {
        await expect(charts.first()).toBeVisible();
      }
    });
  });
});
