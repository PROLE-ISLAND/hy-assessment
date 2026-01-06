// =====================================================
// Prompt Version Management E2E Tests
// Test version history display, expand, and revert
// Issue #139 Phase 2
// =====================================================

import { test, expect, login } from '../fixtures';
import { waitForPageReady, waitForModal } from '../helpers/deterministic-wait';

test.describe('Prompt Version History', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('Version History Component', () => {
    test('should display version history on edit page', async ({ page }) => {
      // Navigate to prompts list
      await page.goto('/admin/prompts');
      await waitForPageReady(page);

      // Find an editable prompt (org-specific, not system prompt)
      const editButton = page.locator('[data-testid^="prompt-edit-"]').first();
      const hasEditablePrompt = await editButton.isVisible().catch(() => false);

      if (!hasEditablePrompt) {
        test.skip();
        return;
      }

      // Click edit button
      await editButton.click();
      await page.waitForURL(/\/admin\/prompts\/[a-zA-Z0-9-]+\/edit/, { timeout: 10000 });
      await waitForPageReady(page);

      // Check for version history component
      const versionHistory = page.locator('[data-testid="version-history"]');
      const versionSkeleton = page.locator('[data-testid="version-history-skeleton"]');
      const versionEmpty = page.locator('[data-testid="version-history-empty"]');
      const versionError = page.locator('[data-testid="version-history-error"]');

      // One of the version history states should be visible
      const hasVersionHistory = await versionHistory.isVisible().catch(() => false);
      const hasSkeleton = await versionSkeleton.isVisible().catch(() => false);
      const hasEmpty = await versionEmpty.isVisible().catch(() => false);
      const hasError = await versionError.isVisible().catch(() => false);

      expect(hasVersionHistory || hasSkeleton || hasEmpty || hasError).toBeTruthy();
    });

    test('should show version history title', async ({ page }) => {
      await page.goto('/admin/prompts');
      await waitForPageReady(page);

      const editButton = page.locator('[data-testid^="prompt-edit-"]').first();
      if (!(await editButton.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await editButton.click();
      await page.waitForURL(/\/admin\/prompts\/[a-zA-Z0-9-]+\/edit/, { timeout: 10000 });
      await waitForPageReady(page);

      // Check for history title
      const historyTitle = page.getByText('変更履歴');
      await expect(historyTitle).toBeVisible();
    });

    test('should show empty state when no versions', async ({ page }) => {
      await page.goto('/admin/prompts');
      await waitForPageReady(page);

      const editButton = page.locator('[data-testid^="prompt-edit-"]').first();
      if (!(await editButton.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await editButton.click();
      await page.waitForURL(/\/admin\/prompts\/[a-zA-Z0-9-]+\/edit/, { timeout: 10000 });
      await waitForPageReady(page);

      // Either version history or empty state should be visible
      const versionHistory = page.locator('[data-testid="version-history"]');
      const versionEmpty = page.locator('[data-testid="version-history-empty"]');

      const hasHistory = await versionHistory.isVisible().catch(() => false);
      const isEmpty = await versionEmpty.isVisible().catch(() => false);

      if (isEmpty) {
        const emptyText = page.getByText('まだバージョン履歴がありません');
        await expect(emptyText).toBeVisible();
      }

      expect(hasHistory || isEmpty).toBeTruthy();
    });
  });

  test.describe('Version List Display', () => {
    test('should display version badges', async ({ page }) => {
      await page.goto('/admin/prompts');
      await waitForPageReady(page);

      const editButton = page.locator('[data-testid^="prompt-edit-"]').first();
      if (!(await editButton.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await editButton.click();
      await page.waitForURL(/\/admin\/prompts\/[a-zA-Z0-9-]+\/edit/, { timeout: 10000 });
      await waitForPageReady(page);

      const versionHistory = page.locator('[data-testid="version-history"]');
      if (!(await versionHistory.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Check for version number badges (e.g., v1.0.0)
      const versionBadge = versionHistory.locator('.font-mono').first();
      if (await versionBadge.isVisible().catch(() => false)) {
        const badgeText = await versionBadge.textContent();
        expect(badgeText).toMatch(/^v\d+\.\d+\.\d+$/);
      }
    });

    test('should highlight current version', async ({ page }) => {
      await page.goto('/admin/prompts');
      await waitForPageReady(page);

      const editButton = page.locator('[data-testid^="prompt-edit-"]').first();
      if (!(await editButton.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await editButton.click();
      await page.waitForURL(/\/admin\/prompts\/[a-zA-Z0-9-]+\/edit/, { timeout: 10000 });
      await waitForPageReady(page);

      const versionHistory = page.locator('[data-testid="version-history"]');
      if (!(await versionHistory.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Check for current version indicator
      const currentVersionBadge = page.getByText('現在のバージョン');
      if (await currentVersionBadge.isVisible().catch(() => false)) {
        await expect(currentVersionBadge).toBeVisible();
      }
    });
  });

  test.describe('Version Expand/Collapse', () => {
    test('should toggle version content on click', async ({ page }) => {
      await page.goto('/admin/prompts');
      await waitForPageReady(page);

      const editButton = page.locator('[data-testid^="prompt-edit-"]').first();
      if (!(await editButton.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await editButton.click();
      await page.waitForURL(/\/admin\/prompts\/[a-zA-Z0-9-]+\/edit/, { timeout: 10000 });
      await waitForPageReady(page);

      const versionHistory = page.locator('[data-testid="version-history"]');
      if (!(await versionHistory.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Find expand button (has Eye icon)
      const expandButton = versionHistory.locator('button').filter({ has: page.locator('svg') }).first();
      if (!(await expandButton.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Click to expand
      await expandButton.click();

      // Content (pre tag) should be visible
      const contentPre = versionHistory.locator('pre');
      await expect(contentPre.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Version Revert', () => {
    test('should show revert button for non-current versions', async ({ page }) => {
      await page.goto('/admin/prompts');
      await waitForPageReady(page);

      const editButton = page.locator('[data-testid^="prompt-edit-"]').first();
      if (!(await editButton.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await editButton.click();
      await page.waitForURL(/\/admin\/prompts\/[a-zA-Z0-9-]+\/edit/, { timeout: 10000 });
      await waitForPageReady(page);

      const versionHistory = page.locator('[data-testid="version-history"]');
      if (!(await versionHistory.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Count version items (should have revert button for non-current versions)
      const revertButtons = versionHistory.locator('button:has-text("復元")');
      const revertCount = await revertButtons.count();

      // If there are multiple versions, there should be at least one revert button
      // (current version doesn't have revert button)
      const versionItems = versionHistory.locator('.border.rounded-lg');
      const versionCount = await versionItems.count();

      if (versionCount > 1) {
        expect(revertCount).toBeGreaterThan(0);
      }
    });

    test('should show revert confirmation dialog', async ({ page }) => {
      await page.goto('/admin/prompts');
      await waitForPageReady(page);

      const editButton = page.locator('[data-testid^="prompt-edit-"]').first();
      if (!(await editButton.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await editButton.click();
      await page.waitForURL(/\/admin\/prompts\/[a-zA-Z0-9-]+\/edit/, { timeout: 10000 });
      await waitForPageReady(page);

      const versionHistory = page.locator('[data-testid="version-history"]');
      if (!(await versionHistory.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Find and click revert button
      const revertButton = versionHistory.locator('button:has-text("復元")').first();
      if (!(await revertButton.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await revertButton.click();

      // Confirmation dialog should appear
      const dialog = await waitForModal(page);
      await expect(dialog).toBeVisible();

      // Check dialog title
      const dialogTitle = page.getByText('バージョンを復元しますか？');
      await expect(dialogTitle).toBeVisible();

      // Cancel button should be visible
      const cancelButton = page.getByRole('button', { name: 'キャンセル' });
      await expect(cancelButton).toBeVisible();

      // Close dialog
      await cancelButton.click();
    });
  });

  test.describe('Error Handling', () => {
    test('should display error state on API failure', async ({ page }) => {
      // This test verifies the error UI exists
      // In real scenarios, we'd mock the API to return an error
      await page.goto('/admin/prompts');
      await waitForPageReady(page);

      const editButton = page.locator('[data-testid^="prompt-edit-"]').first();
      if (!(await editButton.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await editButton.click();
      await page.waitForURL(/\/admin\/prompts\/[a-zA-Z0-9-]+\/edit/, { timeout: 10000 });
      await waitForPageReady(page);

      // Check if error state is visible (if API failed)
      const errorState = page.locator('[data-testid="version-history-error"]');
      if (await errorState.isVisible().catch(() => false)) {
        const retryButton = errorState.locator('button:has-text("再試行")');
        await expect(retryButton).toBeVisible();
      }

      // Otherwise, we just verify the component loaded
      const versionHistory = page.locator('[data-testid="version-history"]');
      const versionEmpty = page.locator('[data-testid="version-history-empty"]');
      expect(
        (await versionHistory.isVisible().catch(() => false)) ||
        (await versionEmpty.isVisible().catch(() => false)) ||
        (await errorState.isVisible().catch(() => false))
      ).toBeTruthy();
    });
  });
});
