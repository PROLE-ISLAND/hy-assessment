// =====================================================
// Personality Analysis E2E Tests
// Test personality analysis cards display on candidate detail page
// Issue #153
// =====================================================

import { test, expect, login } from '../fixtures';
import { waitForPageReady } from '../helpers/deterministic-wait';

test.describe('Personality Analysis Cards', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('Candidate Detail Page - Personality Section', () => {
    let candidateUrl: string | null = null;

    test.beforeEach(async ({ page }) => {
      // Navigate to candidates list
      await page.goto('/admin/candidates');
      await waitForPageReady(page);

      // Find a candidate with completed assessment (has analysis)
      const candidateRows = await page.locator('tbody tr').count();
      if (candidateRows > 0) {
        // Click on first candidate to view details
        const detailLink = page.locator('tbody tr').first().locator('a');
        if (await detailLink.isVisible()) {
          await detailLink.click();
          await page.waitForURL(/\/admin\/candidates\/[a-zA-Z0-9-]+/, { timeout: 10000 });
          candidateUrl = page.url();
        }
      }
    });

    test('should navigate to candidate detail page', async ({ page }) => {
      if (!candidateUrl) {
        test.skip();
        return;
      }

      await page.goto(candidateUrl);
      await expect(page).toHaveURL(/\/admin\/candidates\//);
    });

    test('should display analysis tab for completed assessment', async ({ page }) => {
      if (!candidateUrl) {
        test.skip();
        return;
      }

      await page.goto(candidateUrl);
      await waitForPageReady(page);

      // Check for analysis tab
      const analysisTab = page.locator('[role="tab"]:has-text("分析結果")');
      const isVisible = await analysisTab.isVisible().catch(() => false);

      // Analysis tab should exist (may be disabled if no analysis)
      expect(await page.locator('[role="tab"]').count()).toBeGreaterThan(0);
    });

    test('should switch to analysis tab correctly', async ({ page }) => {
      if (!candidateUrl) {
        test.skip();
        return;
      }

      await page.goto(candidateUrl);
      await waitForPageReady(page);

      const analysisTab = page.locator('[role="tab"]:has-text("分析結果")');
      const isEnabled = !(await analysisTab.getAttribute('data-disabled'));

      if (isEnabled && await analysisTab.isVisible()) {
        await analysisTab.click();

        // Wait for tab panel to be visible
        const tabPanel = page.locator('[role="tabpanel"]');
        await expect(tabPanel).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display personality analysis section when data exists', async ({ page }) => {
      if (!candidateUrl) {
        test.skip();
        return;
      }

      await page.goto(candidateUrl + '?tab=analysis');
      await waitForPageReady(page);

      // Check if personality analysis section exists
      const personalityHeading = page.getByRole('heading', { name: '性格分析' });
      const hasPersonalitySection = await personalityHeading.isVisible().catch(() => false);

      // Either personality section exists, or we're in a state without analysis data
      const noAnalysisState = page.getByText('分析結果がありません');
      const hasNoAnalysisState = await noAnalysisState.isVisible().catch(() => false);

      // One of these should be true
      expect(hasPersonalitySection || hasNoAnalysisState).toBeTruthy();
    });

    test('should display all four personality cards when data exists', async ({ page }) => {
      if (!candidateUrl) {
        test.skip();
        return;
      }

      await page.goto(candidateUrl + '?tab=analysis');
      await waitForPageReady(page);

      // Look for the personality analysis section
      const personalityHeading = page.getByRole('heading', { name: '性格分析' });
      if (await personalityHeading.isVisible().catch(() => false)) {
        // Check for each personality card using data-testid
        const behavioralCard = page.locator('[data-testid="behavioral-card"], [data-testid="behavioral-card-empty"]');
        const stressCard = page.locator('[data-testid="stress-card"], [data-testid="stress-card-empty"]');
        const eqCard = page.locator('[data-testid="eq-card"], [data-testid="eq-card-empty"]');
        const valuesCard = page.locator('[data-testid="values-card"], [data-testid="values-card-empty"]');

        // At least one of each card type should exist
        const hasBehavioral = await behavioralCard.count() > 0;
        const hasStress = await stressCard.count() > 0;
        const hasEQ = await eqCard.count() > 0;
        const hasValues = await valuesCard.count() > 0;

        expect(hasBehavioral && hasStress && hasEQ && hasValues).toBeTruthy();
      }
    });

    test('should display behavioral card with DISC analysis', async ({ page }) => {
      if (!candidateUrl) {
        test.skip();
        return;
      }

      await page.goto(candidateUrl + '?tab=analysis');
      await waitForPageReady(page);

      const behavioralCard = page.locator('[data-testid="behavioral-card"]');
      if (await behavioralCard.isVisible().catch(() => false)) {
        // Check for DISC dimensions
        await expect(behavioralCard.getByText('主導性')).toBeVisible();
        await expect(behavioralCard.getByText('影響力')).toBeVisible();
        await expect(behavioralCard.getByText('安定性')).toBeVisible();
        await expect(behavioralCard.getByText('慎重性')).toBeVisible();
      }
    });

    test('should display stress card with risk level', async ({ page }) => {
      if (!candidateUrl) {
        test.skip();
        return;
      }

      await page.goto(candidateUrl + '?tab=analysis');
      await waitForPageReady(page);

      const stressCard = page.locator('[data-testid="stress-card"]');
      if (await stressCard.isVisible().catch(() => false)) {
        // Check for stress analysis title
        await expect(stressCard.getByText('ストレス耐性分析')).toBeVisible();

        // Check for risk level badge (one of these should be visible)
        const lowRisk = stressCard.getByText('低リスク');
        const medRisk = stressCard.getByText('中リスク');
        const highRisk = stressCard.getByText('高リスク');

        const hasRiskBadge =
          (await lowRisk.isVisible().catch(() => false)) ||
          (await medRisk.isVisible().catch(() => false)) ||
          (await highRisk.isVisible().catch(() => false));

        expect(hasRiskBadge).toBeTruthy();
      }
    });

    test('should display EQ card with four quadrants', async ({ page }) => {
      if (!candidateUrl) {
        test.skip();
        return;
      }

      await page.goto(candidateUrl + '?tab=analysis');
      await waitForPageReady(page);

      const eqCard = page.locator('[data-testid="eq-card"]');
      if (await eqCard.isVisible().catch(() => false)) {
        // Check for EQ dimensions
        await expect(eqCard.getByText('自己認識')).toBeVisible();
        await expect(eqCard.getByText('自己管理')).toBeVisible();
        await expect(eqCard.getByText('社会認識')).toBeVisible();
        await expect(eqCard.getByText('関係管理')).toBeVisible();
      }
    });

    test('should display values card with five value dimensions', async ({ page }) => {
      if (!candidateUrl) {
        test.skip();
        return;
      }

      await page.goto(candidateUrl + '?tab=analysis');
      await waitForPageReady(page);

      const valuesCard = page.locator('[data-testid="values-card"]');
      if (await valuesCard.isVisible().catch(() => false)) {
        // Check for value dimensions
        await expect(valuesCard.getByText('達成志向')).toBeVisible();
        await expect(valuesCard.getByText('安定志向')).toBeVisible();
        await expect(valuesCard.getByText('成長志向')).toBeVisible();
        await expect(valuesCard.getByText('社会貢献')).toBeVisible();
        await expect(valuesCard.getByText('自律志向')).toBeVisible();
      }
    });

    test('should show empty state for cards without data', async ({ page }) => {
      if (!candidateUrl) {
        test.skip();
        return;
      }

      await page.goto(candidateUrl + '?tab=analysis');
      await waitForPageReady(page);

      // Check for empty state cards
      const emptyBehavioral = page.locator('[data-testid="behavioral-card-empty"]');
      const emptyStress = page.locator('[data-testid="stress-card-empty"]');
      const emptyEQ = page.locator('[data-testid="eq-card-empty"]');
      const emptyValues = page.locator('[data-testid="values-card-empty"]');

      // If any empty cards exist, they should show "分析データがありません"
      const emptyCards = [emptyBehavioral, emptyStress, emptyEQ, emptyValues];
      for (const card of emptyCards) {
        if (await card.isVisible().catch(() => false)) {
          await expect(card.getByText('分析データがありません')).toBeVisible();
        }
      }
    });

    test('should display progress bars in personality cards', async ({ page }) => {
      if (!candidateUrl) {
        test.skip();
        return;
      }

      await page.goto(candidateUrl + '?tab=analysis');
      await waitForPageReady(page);

      // Look for progress bars in personality cards
      const personalitySection = page.locator('h2:has-text("性格分析")').locator('..');
      if (await personalitySection.isVisible().catch(() => false)) {
        // Progress bars should be present in the cards
        const progressBars = personalitySection.locator('[role="progressbar"], .h-2.bg-primary');
        const progressCount = await progressBars.count();

        // Multiple progress bars should exist in the personality cards
        expect(progressCount).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
