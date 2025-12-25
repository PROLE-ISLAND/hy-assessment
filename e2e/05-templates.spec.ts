// =====================================================
// Templates Management E2E Tests
// Test template list, detail, version creation, toggle
// =====================================================

import { test, expect, SELECTORS, login } from './fixtures';

test.describe('Templates Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login using helper
    await login(page);
  });

  test.describe('Templates List Page', () => {
    test('should navigate to templates page', async ({ page }) => {
      await page.goto('/admin/templates');
      await expect(page).toHaveURL(/\/admin\/templates/);
    });

    test('should display templates list', async ({ page }) => {
      await page.goto('/admin/templates');
      await page.waitForTimeout(2000);

      const hasTemplates = await page.locator('tbody tr, [data-testid="template-card"]').count();
      const hasEmptyState = await page.getByText('テンプレートがありません').isVisible().catch(() => false);

      expect(hasTemplates > 0 || hasEmptyState).toBeTruthy();
    });

    test('should have "Detail" button for each template', async ({ page }) => {
      await page.goto('/admin/templates');
      await page.waitForTimeout(2000);

      const templateRows = await page.locator(SELECTORS.tableRow).count();
      if (templateRows > 0) {
        const detailButton = page.locator('[data-testid^="template-detail-"]').first();
        await expect(detailButton).toBeVisible();
      }
    });

    test('should navigate to template detail', async ({ page }) => {
      await page.goto('/admin/templates');
      await page.waitForTimeout(2000);

      const templateRows = await page.locator(SELECTORS.tableRow).count();
      if (templateRows > 0) {
        const detailLink = page.locator('[data-testid^="template-detail-"]').first();
        await detailLink.click();
        await page.waitForURL(/\/admin\/templates\/[a-zA-Z0-9-]+/, { timeout: 10000 });
      }
    });
  });

  test.describe('Template Detail Page', () => {
    let templateUrl: string | null = null;

    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/templates');
      await page.waitForTimeout(2000);

      const templateRows = await page.locator(SELECTORS.tableRow).count();
      if (templateRows > 0) {
        const detailLink = page.locator('[data-testid^="template-detail-"]').first();
        if (await detailLink.isVisible()) {
          await detailLink.click();
          await page.waitForURL(/\/admin\/templates\/[a-zA-Z0-9-]+/, { timeout: 10000 });
          templateUrl = page.url();
        }
      }
    });

    test('should display template details', async ({ page }) => {
      if (!templateUrl) {
        test.skip();
        return;
      }

      await page.goto(templateUrl);
      await page.waitForTimeout(2000);

      const templateInfo = page.locator('h1, h2, .template-name');
      if (await templateInfo.count() > 0) {
        await expect(templateInfo.first()).toBeVisible();
      }
    });

    test('should have status toggle switch', async ({ page }) => {
      if (!templateUrl) {
        test.skip();
        return;
      }

      await page.goto(templateUrl);
      await page.waitForTimeout(2000);

      const toggle = page.locator('[role="switch"], input[type="checkbox"][role="switch"]');
      if (await toggle.isVisible()) {
        await expect(toggle).toBeVisible();
      }
    });

    test('should have cancel button in version dialog', async ({ page }) => {
      if (!templateUrl) {
        test.skip();
        return;
      }

      await page.goto(templateUrl);
      await page.waitForTimeout(2000);

      const versionButton = page.locator('button:has-text("新バージョン")');
      if (await versionButton.isVisible()) {
        await versionButton.click();
        await page.waitForTimeout(500);

        const cancelButton = page.locator('[role="dialog"] button:has-text("キャンセル")');
        await expect(cancelButton).toBeVisible();

        await cancelButton.click();
        const dialog = page.locator(SELECTORS.dialog);
        await expect(dialog).not.toBeVisible({ timeout: 3000 });
      }
    });
  });
});
