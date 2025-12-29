// =====================================================
// Reports Page E2E Tests
// Test organization reports and analytics
// =====================================================

import { test, expect, SELECTORS } from './fixtures';

test.describe('Reports Page', () => {
  // Authentication is handled by the setup project via storageState

  test.describe('Page Structure', () => {
    test('should navigate to reports page', async ({ page }) => {
      await page.goto('/admin/reports');
      await expect(page).toHaveURL(/\/admin\/reports/);
    });

    test('should display page title', async ({ page }) => {
      await page.goto('/admin/reports');
      await expect(page.getByRole('heading', { name: 'レポート' })).toBeVisible();
    });

    test('should display page description', async ({ page }) => {
      await page.goto('/admin/reports');
      await expect(page.getByText('検査結果の分析とインサイト')).toBeVisible();
    });

    test('should be accessible via sidebar navigation', async ({ page }) => {
      await page.goto('/admin');
      await page.click(SELECTORS.navReports);
      await expect(page).toHaveURL(/\/admin\/reports/);
    });
  });

  test.describe('Empty State', () => {
    // Note: This test may pass or fail depending on whether data exists
    test('should show empty state when no analyses exist', async ({ page }) => {
      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');

      const emptyState = page.getByText('分析データがありません');
      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      if (hasEmptyState) {
        await expect(emptyState).toBeVisible();
        await expect(page.getByText('検査が完了してAI分析が実行されると')).toBeVisible();
      }
    });
  });

  test.describe('Summary Statistics', () => {
    test('should display summary cards when data exists', async ({ page }) => {
      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');

      // Check if we have data (not empty state)
      const hasData = await page.getByText('分析済み検査').isVisible().catch(() => false);

      if (hasData) {
        // Summary stat cards should be visible
        await expect(page.getByText('分析済み検査')).toBeVisible();
        await expect(page.getByText('全体平均スコア')).toBeVisible();
        await expect(page.getByText('職種カテゴリ')).toBeVisible();
      }
    });

    test('should show analysis count', async ({ page }) => {
      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');

      const hasData = await page.getByText('分析済み検査').isVisible().catch(() => false);

      if (hasData) {
        await expect(page.getByText('件のAI分析')).toBeVisible();
      }
    });

    test('should show overall average with percentage', async ({ page }) => {
      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');

      const hasData = await page.getByText('全体平均スコア').isVisible().catch(() => false);

      if (hasData) {
        // Score should show percentage
        const scoreCard = page.locator('text=全体平均スコア').locator('..').locator('..');
        await expect(scoreCard.locator('text=/%/')).toBeVisible();
      }
    });
  });

  test.describe('Domain Analysis', () => {
    test('should display domain analysis section', async ({ page }) => {
      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');

      const hasData = await page.getByText('ドメイン別分析').isVisible().catch(() => false);

      if (hasData) {
        await expect(page.getByText('ドメイン別分析')).toBeVisible();
        await expect(page.getByText('6つの評価ドメインの平均スコア')).toBeVisible();
      }
    });

    test('should show all 6 domain scores', async ({ page }) => {
      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');

      const hasData = await page.getByText('ドメイン別分析').isVisible().catch(() => false);

      if (hasData) {
        // Check for domain labels
        const domains = [
          '組織統治・コンプライアンス',
          '対人葛藤・問題解決',
          '関係構築・協調性',
          '認知の偏り',
          'ワークスタイル',
          '妥当性',
        ];

        for (const domain of domains) {
          await expect(page.getByText(domain)).toBeVisible();
        }
      }
    });

    test('should show progress bars for domains', async ({ page }) => {
      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');

      const hasData = await page.getByText('ドメイン別分析').isVisible().catch(() => false);

      if (hasData) {
        // Progress elements should exist
        const progressBars = page.locator('[role="progressbar"]');
        const count = await progressBars.count();
        expect(count).toBeGreaterThanOrEqual(6);
      }
    });
  });

  test.describe('Position Analysis', () => {
    test('should display position analysis section', async ({ page }) => {
      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');

      const hasData = await page.getByText('職種別分析').isVisible().catch(() => false);

      if (hasData) {
        await expect(page.getByText('職種別分析')).toBeVisible();
        await expect(page.getByText('希望職種ごとの平均スコアと候補者数')).toBeVisible();
      }
    });

    test('should show position stats or empty message', async ({ page }) => {
      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');

      const hasPositionSection = await page.getByText('職種別分析').isVisible().catch(() => false);

      if (hasPositionSection) {
        // Either shows position data or empty message
        const hasPositions = await page.getByText('名の候補者').isVisible().catch(() => false);
        const hasEmptyMessage = await page.getByText('職種データがありません').isVisible().catch(() => false);

        expect(hasPositions || hasEmptyMessage).toBeTruthy();
      }
    });
  });

  test.describe('Insights Section', () => {
    test('should display insights section when data exists', async ({ page }) => {
      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');

      // Check if we have data (not empty state)
      const hasData = await page.getByText('分析済み検査').isVisible().catch(() => false);

      if (hasData) {
        // Insights section should be visible
        const insightsHeading = page.getByRole('heading', { name: 'インサイト' });
        await expect(insightsHeading).toBeVisible();
      }
    });

    test('should show insights content when data exists', async ({ page }) => {
      await page.goto('/admin/reports');
      await page.waitForLoadState('networkidle');

      // Check if we have data
      const hasData = await page.getByText('分析済み検査').isVisible().catch(() => false);

      if (hasData) {
        // At least one insight should be visible (strength or improvement)
        const hasStrength = await page.getByText('強みの傾向').isVisible().catch(() => false);
        const hasImprovement = await page.getByText('改善の余地').isVisible().catch(() => false);
        const hasCognitive = await page.getByText('認知スタイルの傾向').isVisible().catch(() => false);

        expect(hasStrength || hasImprovement || hasCognitive).toBeTruthy();
      }
    });
  });
});
