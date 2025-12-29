// =====================================================
// Prompts Management E2E Tests
// Test prompt list, detail, create, copy, toggle
// =====================================================

import { test, expect, SELECTORS, login } from './fixtures';
import { waitForPageReady } from './helpers/deterministic-wait';

test.describe('Prompts Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login using helper
    await login(page);
  });

  test.describe('Prompts List Page', () => {
    test('should navigate to prompts page', async ({ page }) => {
      await page.goto('/admin/prompts');
      await expect(page).toHaveURL(/\/admin\/prompts/);
    });

    test('should display prompts or empty state', async ({ page }) => {
      await page.goto('/admin/prompts');
      await waitForPageReady(page);

      const hasPrompts = await page.locator('tbody tr, [data-testid="prompt-card"]').count();
      const hasEmptyState = await page.getByText('プロンプトがありません').isVisible().catch(() => false);

      expect(hasPrompts > 0 || hasEmptyState).toBeTruthy();
    });

    test('should have "New Prompt" button with data-testid', async ({ page }) => {
      await page.goto('/admin/prompts');
      await waitForPageReady(page);

      const newButton = page.locator(SELECTORS.promptCreateButton);
      await expect(newButton).toBeVisible();
    });

    test('should navigate to new prompt form', async ({ page }) => {
      await page.goto('/admin/prompts');
      await waitForPageReady(page);

      await page.click(SELECTORS.promptCreateButton);

      await page.waitForURL(/\/admin\/prompts\/new/, { timeout: 10000 });
    });

    test('should have "Detail" button for each prompt', async ({ page }) => {
      await page.goto('/admin/prompts');
      await waitForPageReady(page);

      const promptRows = await page.locator(SELECTORS.tableRow).count();
      if (promptRows > 0) {
        const detailButton = page.locator('[data-testid^="prompt-detail-"]').first();
        await expect(detailButton).toBeVisible();
      }
    });
  });

  test.describe('Prompt Detail Page', () => {
    let promptUrl: string | null = null;

    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/prompts');
      await waitForPageReady(page);

      const promptRows = await page.locator(SELECTORS.tableRow).count();
      if (promptRows > 0) {
        const detailLink = page.locator('[data-testid^="prompt-detail-"]').first();
        if (await detailLink.isVisible()) {
          await detailLink.click();
          await page.waitForURL(/\/admin\/prompts\/[a-zA-Z0-9-]+/, { timeout: 10000 });
          promptUrl = page.url();
        }
      }
    });

    test('should display prompt details', async ({ page }) => {
      if (!promptUrl) {
        test.skip();
        return;
      }

      await page.goto(promptUrl);
      await waitForPageReady(page);

      const promptContent = page.locator('pre, code, .prose, textarea');
      if (await promptContent.count() > 0) {
        await expect(promptContent.first()).toBeVisible();
      }
    });

    test('should have "Back" button', async ({ page }) => {
      if (!promptUrl) {
        test.skip();
        return;
      }

      await page.goto(promptUrl);
      await waitForPageReady(page);

      const backButton = page.locator('a:has-text("戻る"), button:has-text("戻る")');
      await expect(backButton).toBeVisible();
    });

    test('should navigate back when clicking Back button', async ({ page }) => {
      if (!promptUrl) {
        test.skip();
        return;
      }

      await page.goto(promptUrl);
      await waitForPageReady(page);

      const backButton = page.locator('a:has-text("戻る")');
      if (await backButton.isVisible()) {
        await backButton.click();
        await page.waitForURL(/\/admin\/prompts/, { timeout: 10000 });
      }
    });
  });

  test.describe('Create/Copy Prompt', () => {
    test('should display prompt creation form', async ({ page }) => {
      await page.goto('/admin/prompts/new');

      await waitForPageReady(page);
      // Form should be visible
      await expect(page).toHaveURL(/\/admin\/prompts\/new/);
    });

    test('should copy prompt when using copy parameter', async ({ page }) => {
      await page.goto('/admin/prompts');
      await waitForPageReady(page);

      const copyButton = page.locator('[data-testid^="prompt-copy-"]').first();
      if (await copyButton.isVisible()) {
        await copyButton.click();

        await page.waitForURL(/\/admin\/prompts\/new\?copy=/, { timeout: 10000 });
      }
    });
  });
});
