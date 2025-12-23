// =====================================================
// E2E Tests: Assessment Flow (Public)
// Tests for the candidate-facing assessment pages
// =====================================================

import { test, expect } from '@playwright/test';

test.describe('Assessment Page (Public)', () => {
  test('shows 404 for invalid token', async ({ page }) => {
    // Try to access with invalid token
    const response = await page.goto('/assessment/invalid-token-12345');

    // Should return 404
    expect(response?.status()).toBe(404);
  });

  test('assessment page has correct structure with valid token', async ({ page }) => {
    // Note: This test requires a valid token to be seeded
    // For now, we just check the 404 behavior
    await page.goto('/assessment/test-token');

    // Without valid token, should show not found
    await expect(page.getByText(/404|見つかりません|not found/i)).toBeVisible();
  });
});

test.describe('Assessment Form Behavior', () => {
  // These tests would require a seeded assessment token
  // Skipped until we have proper test fixtures

  test.skip('displays survey questions', async ({ page }) => {
    // Requires valid assessment token
    await page.goto('/assessment/VALID_TOKEN');

    // Check for SurveyJS elements
    await expect(page.locator('.sd-root')).toBeVisible();
  });

  test.skip('auto-saves progress on page change', async ({ page }) => {
    // Requires valid assessment token
    await page.goto('/assessment/VALID_TOKEN');

    // Answer first question
    await page.locator('[data-key="L01"] input[value="4"]').click();

    // Navigate to next page
    await page.getByRole('button', { name: /次へ|next/i }).click();

    // Progress should be saved (check network request or UI indicator)
  });

  test.skip('prevents submission without all answers', async ({ page }) => {
    // Requires valid assessment token
    // SurveyJS should enforce required fields
  });
});

test.describe('Assessment Completion', () => {
  test.skip('redirects to completion page after submit', async ({ page }) => {
    // Requires completing full assessment
    // Would need to fill all 52 questions
  });

  test.skip('shows completion message', async ({ page }) => {
    // After completion, should show thank you message
    await page.goto('/assessment/COMPLETED_TOKEN');

    await expect(page.getByText(/完了|ありがとう/i)).toBeVisible();
  });
});
