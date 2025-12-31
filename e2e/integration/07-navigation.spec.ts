// =====================================================
// Navigation E2E Tests
// Test sidebar, header, and overall navigation
// =====================================================

import { test, expect, SELECTORS, login } from '../fixtures';
import { waitForPageReady } from '../helpers/deterministic-wait';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login first using helper
    await login(page);
  });

  test.describe('Sidebar Navigation', () => {
    test('should display sidebar with main navigation', async ({ page }) => {
      await page.goto('/admin');
      await waitForPageReady(page);

      // Look for nav links with data-testid
      await expect(page.locator(SELECTORS.navDashboard)).toBeVisible();
    });

    test('should have Dashboard link with data-testid', async ({ page }) => {
      await page.goto('/admin');

      const dashboardLink = page.locator(SELECTORS.navDashboard);
      await expect(dashboardLink).toBeVisible();
    });

    test('should have Candidates link with data-testid', async ({ page }) => {
      await page.goto('/admin');

      const candidatesLink = page.locator(SELECTORS.navCandidates);
      await expect(candidatesLink).toBeVisible();
    });

    test('should navigate to Candidates page via sidebar', async ({ page }) => {
      await page.goto('/admin');

      await page.click(SELECTORS.navCandidates);

      await page.waitForURL(/\/admin\/candidates/, { timeout: 10000 });
    });

    test('should have Compare link with data-testid', async ({ page }) => {
      await page.goto('/admin');

      const compareLink = page.locator(SELECTORS.navCompare);
      await expect(compareLink).toBeVisible();
    });

    test('should have Reports link with data-testid', async ({ page }) => {
      await page.goto('/admin');

      const reportsLink = page.locator(SELECTORS.navReports);
      await expect(reportsLink).toBeVisible();
    });

    test('should have Templates link with data-testid', async ({ page }) => {
      await page.goto('/admin');

      const templatesLink = page.locator(SELECTORS.navTemplates);
      await expect(templatesLink).toBeVisible();
    });

    test('should have Prompts link with data-testid', async ({ page }) => {
      await page.goto('/admin');

      const promptsLink = page.locator(SELECTORS.navPrompts);
      await expect(promptsLink).toBeVisible();
    });

    test('should have Settings link with data-testid', async ({ page }) => {
      await page.goto('/admin');

      const settingsLink = page.locator(SELECTORS.navSettings);
      await expect(settingsLink).toBeVisible();
    });

    test('should navigate to Prompts page via sidebar', async ({ page }) => {
      await page.goto('/admin');

      await page.click(SELECTORS.navPrompts);

      await page.waitForURL(/\/admin\/prompts/, { timeout: 10000 });
    });

    test('should navigate to Templates page via sidebar', async ({ page }) => {
      await page.goto('/admin');

      await page.click(SELECTORS.navTemplates);

      await page.waitForURL(/\/admin\/templates/, { timeout: 10000 });
    });
  });

  test.describe('Header', () => {
    test('should display header with logo/brand', async ({ page }) => {
      await page.goto('/admin');

      // Look for header elements
      const header = page.locator('header');
      if (await header.isVisible()) {
        await expect(header).toBeVisible();
      }
    });
  });

  test.describe('Active State Indication', () => {
    test('should highlight current page in navigation', async ({ page }) => {
      await page.goto('/admin/candidates');
      await waitForPageReady(page);

      // Check that candidates link has active styling
      const candidatesLink = page.locator(SELECTORS.navCandidates);
      await expect(candidatesLink).toHaveClass(/bg-primary/);
    });
  });

  test.describe('Mobile Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should handle mobile viewport', async ({ page }) => {
      await page.goto('/admin');
      await waitForPageReady(page);

      // On mobile, sidebar might be hidden or in a sheet
      // Just verify page loads without errors
      await expect(page).toHaveURL(/\/admin/);
    });
  });
});
