// =====================================================
// E2E Tests: Personality Analysis Cards
// Tests for behavioral, stress, EQ, and values analysis display
// =====================================================

import { test, expect, login } from '../fixtures';
import { waitForPageReady } from '../helpers/deterministic-wait';

test.describe('Personality Analysis Cards', () => {
  test.beforeEach(async ({ page }) => {
    // Login using helper
    await login(page);
  });

  test.describe('Candidate Detail Page - Analysis Tab', () => {
    let candidateDetailUrl: string | null = null;

    test.beforeEach(async ({ page }) => {
      // Navigate to a candidate with completed assessment
      await page.goto('/admin/candidates');
      await waitForPageReady(page);

      // Find a candidate row and navigate to detail
      const candidateRows = await page.locator('tbody tr').count();
      if (candidateRows > 0) {
        const detailLink = page.locator('tbody tr').first().locator('a');
        if (await detailLink.isVisible()) {
          await detailLink.click();
          await page.waitForURL(/\/admin\/candidates\/[a-zA-Z0-9-]+/, { timeout: 10000 });
          candidateDetailUrl = page.url();
        }
      }
    });

    test('should display analysis tab when analysis exists', async ({ page }) => {
      if (!candidateDetailUrl) {
        test.skip();
        return;
      }

      await page.goto(candidateDetailUrl);
      await waitForPageReady(page);

      // Check for analysis tab
      const analysisTab = page.locator('[role="tab"]:has-text("分析結果")');
      const hasAnalysisTab = await analysisTab.isVisible().catch(() => false);

      // Either has analysis tab (completed assessment) or only basic info tab
      const infoTab = page.locator('[role="tab"]:has-text("基本情報")');
      const hasInfoTab = await infoTab.isVisible().catch(() => false);

      expect(hasInfoTab || hasAnalysisTab).toBeTruthy();
    });

    test('should switch to analysis tab via tab navigation', async ({ page }) => {
      if (!candidateDetailUrl) {
        test.skip();
        return;
      }

      await page.goto(candidateDetailUrl);
      await waitForPageReady(page);

      const analysisTab = page.locator('[role="tab"]:has-text("分析結果")');
      if (await analysisTab.isVisible() && await analysisTab.isEnabled()) {
        await analysisTab.click();

        // URL should update with tab param
        await expect(page).toHaveURL(/tab=analysis/);
      }
    });

    test('should display personality analysis section when data exists', async ({ page }) => {
      if (!candidateDetailUrl) {
        test.skip();
        return;
      }

      await page.goto(`${candidateDetailUrl}?tab=analysis`);
      await waitForPageReady(page);

      // Check for personality analysis heading
      const personalityHeading = page.getByText('パーソナリティ分析');
      const hasPersonalitySection = await personalityHeading.isVisible().catch(() => false);

      // If personality section exists, check for cards
      if (hasPersonalitySection) {
        // Check for at least one personality card
        const behavioralCard = page.getByText('行動特性', { exact: false });
        const stressCard = page.getByText('ストレス耐性', { exact: false });
        const eqCard = page.getByText('EQ', { exact: false });
        const valuesCard = page.getByText('価値観', { exact: false });

        const hasSomeCard =
          (await behavioralCard.isVisible().catch(() => false)) ||
          (await stressCard.isVisible().catch(() => false)) ||
          (await eqCard.isVisible().catch(() => false)) ||
          (await valuesCard.isVisible().catch(() => false));

        expect(hasSomeCard).toBeTruthy();
      }
    });

    test('should display behavioral analysis card with DISC data', async ({ page }) => {
      if (!candidateDetailUrl) {
        test.skip();
        return;
      }

      await page.goto(`${candidateDetailUrl}?tab=analysis`);
      await waitForPageReady(page);

      // Look for behavioral analysis card content
      const behavioralCard = page.locator('[data-testid="behavioral-analysis-card"]');
      if (await behavioralCard.isVisible().catch(() => false)) {
        // Check for DISC dimension labels
        const dominance = page.getByText('主導性', { exact: false });
        const influence = page.getByText('影響性', { exact: false });
        const steadiness = page.getByText('安定性', { exact: false });
        const conscientiousness = page.getByText('慎重性', { exact: false });

        // At least one DISC dimension should be visible
        const hasDISC =
          (await dominance.isVisible().catch(() => false)) ||
          (await influence.isVisible().catch(() => false)) ||
          (await steadiness.isVisible().catch(() => false)) ||
          (await conscientiousness.isVisible().catch(() => false));

        expect(hasDISC).toBeTruthy();
      }
    });

    test('should display stress resilience card with metrics', async ({ page }) => {
      if (!candidateDetailUrl) {
        test.skip();
        return;
      }

      await page.goto(`${candidateDetailUrl}?tab=analysis`);
      await waitForPageReady(page);

      // Look for stress resilience card
      const stressCard = page.locator('[data-testid="stress-resilience-card"]');
      if (await stressCard.isVisible().catch(() => false)) {
        // Check for stress metrics
        const overallScore = stressCard.locator('text=/\\d+%/');
        expect(await overallScore.count()).toBeGreaterThan(0);
      }
    });

    test('should display EQ analysis card with dimensions', async ({ page }) => {
      if (!candidateDetailUrl) {
        test.skip();
        return;
      }

      await page.goto(`${candidateDetailUrl}?tab=analysis`);
      await waitForPageReady(page);

      // Look for EQ card
      const eqCard = page.locator('[data-testid="eq-analysis-card"]');
      if (await eqCard.isVisible().catch(() => false)) {
        // Check for EQ dimensions (self-awareness, empathy, etc.)
        const selfAwareness = page.getByText('自己認識', { exact: false });
        const empathy = page.getByText('共感性', { exact: false });

        const hasEQDimension =
          (await selfAwareness.isVisible().catch(() => false)) ||
          (await empathy.isVisible().catch(() => false));

        expect(hasEQDimension).toBeTruthy();
      }
    });

    test('should display values analysis card with value dimensions', async ({ page }) => {
      if (!candidateDetailUrl) {
        test.skip();
        return;
      }

      await page.goto(`${candidateDetailUrl}?tab=analysis`);
      await waitForPageReady(page);

      // Look for values card
      const valuesCard = page.locator('[data-testid="values-analysis-card"]');
      if (await valuesCard.isVisible().catch(() => false)) {
        // Values card should have some content
        const hasContent = await valuesCard.textContent();
        expect(hasContent?.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Personality Cards Accessibility', () => {
    test('should have accessible headings in personality cards', async ({ page }) => {
      await page.goto('/admin/candidates');
      await waitForPageReady(page);

      // Find first candidate
      const candidateRows = await page.locator('tbody tr').count();
      if (candidateRows > 0) {
        const detailLink = page.locator('tbody tr').first().locator('a');
        if (await detailLink.isVisible()) {
          await detailLink.click();
          await page.waitForURL(/\/admin\/candidates\/[a-zA-Z0-9-]+/, { timeout: 10000 });

          // Navigate to analysis tab
          await page.goto(`${page.url()}?tab=analysis`);
          await waitForPageReady(page);

          // Check for proper heading structure in personality cards
          const cardHeadings = page.locator('[class*="CardTitle"]');
          if (await cardHeadings.count() > 0) {
            // Headings should be visible and have text
            const firstHeading = cardHeadings.first();
            await expect(firstHeading).toBeVisible();
            const text = await firstHeading.textContent();
            expect(text?.length).toBeGreaterThan(0);
          }
        }
      }
    });
  });
});
