// =====================================================
// Candidates Management E2E Tests
// Test candidate list, add, detail, and actions
// =====================================================

import { test, expect, SELECTORS, navigateToNewCandidateForm } from './fixtures';
import { waitForPageReady } from './helpers/deterministic-wait';

test.describe('Candidates Management', () => {
  // Authentication is handled by the setup project via storageState
  // No need for login in beforeEach

  test.describe('Candidates List Page', () => {
    test('should navigate to candidates page', async ({ page }) => {
      await page.goto('/admin/candidates');
      await expect(page).toHaveURL(/\/admin\/candidates/);
      await expect(page.getByRole('heading', { name: '候補者管理' })).toBeVisible();
    });

    test('should display "Add Candidate" button with data-testid', async ({ page }) => {
      await page.goto('/admin/candidates');

      const addButton = page.locator(SELECTORS.addCandidateButton);
      await expect(addButton).toBeVisible();
    });

    test('should navigate to new candidate form when clicking add button', async ({ page }) => {
      await page.goto('/admin/candidates');

      await page.click(SELECTORS.addCandidateButton);

      await page.waitForURL('/admin/candidates/new**', { timeout: 10000 });
      await expect(page).toHaveURL(/\/admin\/candidates\/new/);
    });

    test('should display candidate table/list', async ({ page }) => {
      await page.goto('/admin/candidates');

      // Wait for content to load
      await waitForPageReady(page);

      // Either shows candidates or empty state
      const hasCandidates = await page.locator(SELECTORS.tableRow).count();
      const hasEmptyState = await page.getByText('候補者がいません').isVisible().catch(() => false);

      expect(hasCandidates > 0 || hasEmptyState).toBeTruthy();
    });

    test('should have selection checkboxes when candidates exist', async ({ page }) => {
      await page.goto('/admin/candidates');
      await waitForPageReady(page);

      const candidateRows = await page.locator(SELECTORS.tableRow).count();
      if (candidateRows > 0) {
        const checkboxes = page.locator('tbody [role="checkbox"]');
        await expect(checkboxes.first()).toBeVisible();
      }
    });

    test('should show selection controls when candidates selected', async ({ page }) => {
      await page.goto('/admin/candidates');
      await waitForPageReady(page);

      const candidateRows = await page.locator(SELECTORS.tableRow).count();
      if (candidateRows > 0) {
        // Click first checkbox
        await page.locator('tbody [role="checkbox"]').first().click();

        // Should show selection controls with data-testid
        await expect(page.locator(SELECTORS.selectAllButton)).toBeVisible({ timeout: 5000 });
      }
    });

    test('should have "Detail" button for each candidate row', async ({ page }) => {
      await page.goto('/admin/candidates');
      await waitForPageReady(page);

      const candidateRows = await page.locator(SELECTORS.tableRow).count();
      if (candidateRows > 0) {
        // Look for detail button with data-testid pattern
        const detailButton = page.locator('[data-testid^="candidate-detail-"]').first();
        await expect(detailButton).toBeVisible();
      }
    });

    test('should navigate to candidate detail when clicking Detail button', async ({ page }) => {
      await page.goto('/admin/candidates');
      await waitForPageReady(page);

      const candidateRows = await page.locator(SELECTORS.tableRow).count();
      if (candidateRows > 0) {
        const detailButton = page.locator('[data-testid^="candidate-detail-"]').first();
        await detailButton.click();

        await page.waitForURL(/\/admin\/candidates\/[a-zA-Z0-9-]+/, { timeout: 10000 });
      }
    });
  });

  test.describe('New Candidate Form', () => {
    test('should display candidate registration form', async ({ page }) => {
      // Navigate through UI to maintain session
      await navigateToNewCandidateForm(page);

      // Check form elements using data-testid
      await expect(page.locator(SELECTORS.candidateName)).toBeVisible();
      await expect(page.locator(SELECTORS.candidateEmail)).toBeVisible();
    });

    test('should have cancel button that navigates back', async ({ page }) => {
      await navigateToNewCandidateForm(page);

      const cancelButton = page.locator(SELECTORS.candidateCancel);
      await expect(cancelButton).toBeVisible();

      await cancelButton.click();
      await page.waitForURL(/\/admin\/candidates/, { timeout: 10000 });
    });

    test('should have submit button for registration', async ({ page }) => {
      await navigateToNewCandidateForm(page);

      const submitButton = page.locator(SELECTORS.candidateSubmit);
      await expect(submitButton).toBeVisible();
    });

    test('should show validation error for empty submission', async ({ page }) => {
      await navigateToNewCandidateForm(page);

      await page.click(SELECTORS.candidateSubmit);

      // Should show validation errors or remain on form
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/admin\/candidates\/new/);
    });

    test('should have position selection checkboxes', async ({ page }) => {
      await navigateToNewCandidateForm(page);

      // Check for checkboxes (positions)
      const checkboxes = page.locator('[role="checkbox"]');
      await expect(checkboxes.first()).toBeVisible();
    });

    test('should successfully create candidate with valid data', async ({ page }) => {
      await navigateToNewCandidateForm(page);

      const testEmail = `e2e-test-${Date.now()}@example.com`;

      await page.fill(SELECTORS.candidateName, 'E2E テスト候補者');
      await page.fill(SELECTORS.candidateEmail, testEmail);

      // Select at least one position
      const positionCheckbox = page.locator('[role="checkbox"]').first();
      await positionCheckbox.click();

      await page.click(SELECTORS.candidateSubmit);

      // Should redirect to candidate list
      await page.waitForURL(/\/admin\/candidates/, { timeout: 10000 });
      expect(page.url().includes('/admin/candidates')).toBeTruthy();
    });
  });

  test.describe('Candidate Detail Page', () => {
    test('should display candidate information', async ({ page }) => {
      await page.goto('/admin/candidates');
      await waitForPageReady(page);

      const candidateRows = await page.locator(SELECTORS.tableRow).count();
      if (candidateRows > 0) {
        const detailButton = page.locator('[data-testid^="candidate-detail-"]').first();
        await detailButton.click();
        await page.waitForURL(/\/admin\/candidates\/[a-zA-Z0-9-]+/, { timeout: 10000 });

        // Should display candidate info
        await expect(page.getByRole('heading')).toBeVisible();
      }
    });
  });
});
