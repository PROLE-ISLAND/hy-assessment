// =====================================================
// Candidate Comparison E2E Tests
// Test comparison page, selection, charts
// =====================================================

import { test, expect, SELECTORS } from '../fixtures';

test.describe('Candidate Comparison', () => {
  // Authentication is handled by the setup project via storageState

  test.describe('Page Structure', () => {
    test('should navigate to compare page', async ({ page }) => {
      await page.goto('/admin/compare');
      await expect(page).toHaveURL(/\/admin\/compare/);
    });

    test('should display page title', async ({ page }) => {
      await page.goto('/admin/compare');
      await expect(page.getByRole('heading', { name: '候補者比較' })).toBeVisible();
    });

    test('should display page description', async ({ page }) => {
      await page.goto('/admin/compare');
      await expect(page.getByText('複数の候補者を並べて比較できます')).toBeVisible();
    });

    test('should be accessible via sidebar navigation', async ({ page }) => {
      await page.goto('/admin');
      await page.click(SELECTORS.navCompare);
      await expect(page).toHaveURL(/\/admin\/compare/);
    });
  });

  test.describe('Filter Controls', () => {
    test('should display position filter', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      const positionFilter = page.locator(SELECTORS.comparePositionFilter);
      await expect(positionFilter).toBeVisible();
    });

    test('should display select all button', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      const selectAllButton = page.locator(SELECTORS.compareSelectAllButton);
      await expect(selectAllButton).toBeVisible();
    });

    test('should show selection count', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(/\d+人選択中/)).toBeVisible();
    });

    test('should filter by position when selected', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      const positionFilter = page.locator(SELECTORS.comparePositionFilter);
      await positionFilter.click();

      // Check if dropdown opens
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();

      // Select "すべて" option
      await page.getByRole('option', { name: 'すべて' }).click();
    });
  });

  test.describe('Candidate Selection', () => {
    test('should display candidate list section', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      await expect(page.getByText('候補者一覧')).toBeVisible();
      await expect(page.getByText('比較したい候補者を選択してください')).toBeVisible();
    });

    test('should show empty state or candidates', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      const hasCandidates = await page.locator('[role="checkbox"]').count();
      const hasEmptyState = await page.getByText('該当する候補者がいません').isVisible().catch(() => false);

      expect(hasCandidates > 0 || hasEmptyState).toBeTruthy();
    });

    test('should toggle candidate selection', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      const checkboxes = page.locator('[role="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount > 0) {
        const firstCheckbox = checkboxes.first();
        await firstCheckbox.click();

        // Should update selection count
        await expect(page.getByText(/\d+人選択中/)).toBeVisible();
      }
    });

    test('should limit selection to 5 candidates', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      const checkboxes = page.locator('[role="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount >= 5) {
        // Select first 5
        for (let i = 0; i < 5; i++) {
          await checkboxes.nth(i).click();
        }

        // 6th checkbox should be disabled
        if (checkboxCount > 5) {
          const sixthCheckbox = checkboxes.nth(5);
          await expect(sixthCheckbox).toBeDisabled();
        }
      }
    });

    test('should select all (up to 5) when clicking select all button', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      const checkboxes = page.locator('[role="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount > 0) {
        await page.click(SELECTORS.compareSelectAllButton);

        // Check that selection count updated
        const expectedCount = Math.min(checkboxCount, 5);
        await expect(page.getByText(`${expectedCount}人選択中`)).toBeVisible();
      }
    });

    test('should clear selection when clicking clear button', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      const checkboxes = page.locator('[role="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount > 0) {
        // First select some
        await checkboxes.first().click();

        // Clear button should appear
        const clearButton = page.locator('[data-testid="compare-clear-button"]');
        await expect(clearButton).toBeVisible();

        await clearButton.click();

        // Selection should be 0
        await expect(page.getByText('0人選択中')).toBeVisible();
      }
    });
  });

  test.describe('Comparison Display', () => {
    test('should show prompt to select candidates when less than 2 selected', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      // Clear any existing selection first
      const clearButton = page.locator('[data-testid="compare-clear-button"]');
      if (await clearButton.isVisible()) {
        await clearButton.click();
      }

      const checkboxes = page.locator('[role="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount > 0) {
        // Select only 1
        await checkboxes.first().click();

        // Should show empty state message
        await expect(page.getByText('候補者を選択してください')).toBeVisible();
        await expect(page.getByText('2人以上の候補者を選択すると')).toBeVisible();
      }
    });

    test('should display comparison table when 2+ candidates selected', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      const checkboxes = page.locator('[role="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount >= 2) {
        // Select 2 candidates
        await checkboxes.nth(0).click();
        await checkboxes.nth(1).click();

        // Comparison table should appear
        await expect(page.getByText('スコア比較表')).toBeVisible();

        // Table headers should be visible
        await expect(page.getByRole('columnheader', { name: '候補者' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: '総合' })).toBeVisible();
      }
    });

    test('should display radar chart when 2+ candidates selected', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      const checkboxes = page.locator('[role="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount >= 2) {
        // Select 2 candidates
        await checkboxes.nth(0).click();
        await checkboxes.nth(1).click();

        // Radar chart section should appear
        await expect(page.getByText('レーダーチャート比較')).toBeVisible();
        await expect(page.getByText('5つのドメインスコアを視覚的に比較')).toBeVisible();

        // Chart container should exist
        const chartContainer = page.locator('.recharts-wrapper');
        await expect(chartContainer).toBeVisible();
      }
    });

    test('should show all domain columns in comparison table', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      const checkboxes = page.locator('[role="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount >= 2) {
        await checkboxes.nth(0).click();
        await checkboxes.nth(1).click();

        // All domain columns should be visible
        const domains = ['GOV', 'CONFLICT', 'REL', 'COG', 'WORK', 'VALID'];
        for (const domain of domains) {
          await expect(page.getByRole('columnheader', { name: domain })).toBeVisible();
        }
      }
    });
  });

  test.describe('Candidate Links', () => {
    test('should have link to candidate detail', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      const candidateLinks = page.locator('[data-testid^="compare-candidate-link-"]');
      const linkCount = await candidateLinks.count();

      if (linkCount > 0) {
        await expect(candidateLinks.first()).toBeVisible();
      }
    });

    test('should navigate to candidate detail when clicking link', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      const candidateLinks = page.locator('[data-testid^="compare-candidate-link-"]');
      const linkCount = await candidateLinks.count();

      if (linkCount > 0) {
        await candidateLinks.first().click();
        await page.waitForURL(/\/admin\/candidates\/[a-zA-Z0-9-]+/);
      }
    });
  });

  test.describe('Selection Persistence', () => {
    test('should persist selection in localStorage', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      const checkboxes = page.locator('[role="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount > 0) {
        // Select a candidate
        await checkboxes.first().click();

        // Check localStorage
        const stored = await page.evaluate(() => {
          return localStorage.getItem('hy-assessment-compare-selection');
        });

        expect(stored).not.toBeNull();
      }
    });

    test('should restore selection on page reload', async ({ page }) => {
      await page.goto('/admin/compare');
      await page.waitForLoadState('networkidle');

      const checkboxes = page.locator('[role="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount > 0) {
        // Select a candidate
        await checkboxes.first().click();

        // Get current selection count
        const countBefore = await page.getByText(/(\d+)人選択中/).textContent();

        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Selection should be restored
        const countAfter = await page.getByText(/(\d+)人選択中/).textContent();
        expect(countAfter).toBe(countBefore);
      }
    });
  });
});
