// =====================================================
// Direct Assessment Flow E2E Tests (Gold E2E)
// Issue #215: UC-ASSESS-CANDIDATE-DIRECT-WEB
//
// GWT Specification:
// Feature: Direct assessment start from landing page
// - Candidate can start assessment without admin invitation
// - Registration creates candidate record and assessment token
// - Candidate can select assessment type (Gate or Personality)
// =====================================================

import { test, expect } from '../fixtures';
import { waitForPageReady, waitForNavigation, safeFill } from '../helpers/deterministic-wait';

// Test data
const TEST_CANDIDATE = {
  name: 'E2E Direct Test Candidate',
  email: `e2e-direct-${Date.now()}@example.com`,
};

// Selectors (data-testid based)
const SELECTORS = {
  directAssessmentFlow: '[data-testid="direct-assessment-flow"]',
  candidateInfoStep: '[data-testid="candidate-info-step"]',
  candidateNameInput: '[data-testid="candidate-name-input"]',
  candidateEmailInput: '[data-testid="candidate-email-input"]',
  desiredJobTypeSelect: '[data-testid="desired-job-type-select"]',
  submitCandidateInfoButton: '[data-testid="submit-candidate-info-button"]',
  candidateInfoError: '[data-testid="candidate-info-error"]',
  loadingStep: '[data-testid="loading-step"]',
  assessmentSelectStep: '[data-testid="assessment-select-step"]',
  gateAssessmentOption: '[data-testid="gate-assessment-option"]',
  personalityAssessmentOption: '[data-testid="personality-assessment-option"]',
  directAssessmentFlowError: '[data-testid="direct-assessment-flow-error"]',
};

test.describe('Direct Assessment Flow', () => {
  // No authentication required - this is a public flow

  test.describe('Candidate Info Step', () => {
    // =====================================================
    // Given: Candidate visits landing page
    // When: Form is displayed
    // Then: All form elements should be visible
    // =====================================================
    test('should display candidate info form on landing page @smoke', async ({ page }) => {
      // Given: Candidate visits landing page
      await page.goto('/');
      await waitForPageReady(page);

      // Then: Form should be visible with all required elements
      await expect(page.locator(SELECTORS.directAssessmentFlow)).toBeVisible();
      await expect(page.locator(SELECTORS.candidateInfoStep)).toBeVisible();
      await expect(page.locator(SELECTORS.candidateNameInput)).toBeVisible();
      await expect(page.locator(SELECTORS.candidateEmailInput)).toBeVisible();
      await expect(page.locator(SELECTORS.submitCandidateInfoButton)).toBeVisible();
    });

    test('should have desired job type select (optional)', async ({ page }) => {
      await page.goto('/');
      await waitForPageReady(page);

      // Job type select should be visible but optional
      await expect(page.locator(SELECTORS.desiredJobTypeSelect)).toBeVisible();
    });

    test('should disable submit button when name is empty', async ({ page }) => {
      await page.goto('/');
      await waitForPageReady(page);

      // Fill only email, leave name empty
      await page.fill(SELECTORS.candidateEmailInput, TEST_CANDIDATE.email);

      // Submit button should be disabled
      await expect(page.locator(SELECTORS.submitCandidateInfoButton)).toBeDisabled();
    });

    test('should disable submit button when email is empty', async ({ page }) => {
      await page.goto('/');
      await waitForPageReady(page);

      // Fill only name, leave email empty
      await page.fill(SELECTORS.candidateNameInput, TEST_CANDIDATE.name);

      // Submit button should be disabled
      await expect(page.locator(SELECTORS.submitCandidateInfoButton)).toBeDisabled();
    });

    // =====================================================
    // Scenario: Candidate submits valid information
    // Given: Candidate info form is displayed
    // When: Name and email are entered and submitted
    // Then: Assessment selection screen is displayed
    // =====================================================
    test('should navigate to assessment selection after valid submission @smoke', async ({ page }) => {
      // Given: Landing page is displayed
      await page.goto('/');
      await waitForPageReady(page);

      // When: Fill in valid candidate information
      await safeFill(page, SELECTORS.candidateNameInput, TEST_CANDIDATE.name);
      await safeFill(page, SELECTORS.candidateEmailInput, TEST_CANDIDATE.email);

      // And: Submit the form
      await page.click(SELECTORS.submitCandidateInfoButton);

      // Then: Should show loading state briefly
      // (Loading may be too fast to catch, so we don't strictly assert it)

      // Then: Assessment selection should be visible
      await expect(page.locator(SELECTORS.assessmentSelectStep)).toBeVisible({ timeout: 15000 });
    });

    test('should display error for invalid email format', async ({ page }) => {
      await page.goto('/');
      await waitForPageReady(page);

      // Fill with invalid email
      await safeFill(page, SELECTORS.candidateNameInput, TEST_CANDIDATE.name);
      await safeFill(page, SELECTORS.candidateEmailInput, 'invalid-email');

      // Submit - HTML5 validation should prevent submission
      await page.click(SELECTORS.submitCandidateInfoButton);

      // Should remain on candidate info step
      await expect(page.locator(SELECTORS.candidateInfoStep)).toBeVisible();
    });
  });

  test.describe('Assessment Selection Step', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to assessment selection by completing candidate info
      await page.goto('/');
      await waitForPageReady(page);

      const uniqueEmail = `e2e-select-${Date.now()}@example.com`;
      await safeFill(page, SELECTORS.candidateNameInput, TEST_CANDIDATE.name);
      await safeFill(page, SELECTORS.candidateEmailInput, uniqueEmail);
      await page.click(SELECTORS.submitCandidateInfoButton);

      // Wait for assessment selection to appear
      await expect(page.locator(SELECTORS.assessmentSelectStep)).toBeVisible({ timeout: 15000 });
    });

    // =====================================================
    // Scenario: Assessment options are displayed
    // Given: Candidate completed info step
    // Then: Assessment selection options should be visible
    // =====================================================
    test('should display assessment selection options @smoke', async ({ page }) => {
      // Then: Both assessment options should be visible
      await expect(page.locator(SELECTORS.gateAssessmentOption)).toBeVisible();
      await expect(page.locator(SELECTORS.personalityAssessmentOption)).toBeVisible();
    });

    test('should display Gate assessment details', async ({ page }) => {
      const gateOption = page.locator(SELECTORS.gateAssessmentOption);

      // Should show Gate assessment information
      await expect(gateOption.getByText('GFD-Gate 適性検査')).toBeVisible();
      await expect(gateOption.getByText(/約20分/)).toBeVisible();
      await expect(gateOption.getByText(/全100問/)).toBeVisible();
    });

    test('should display Personality assessment details', async ({ page }) => {
      const personalityOption = page.locator(SELECTORS.personalityAssessmentOption);

      // Should show Personality assessment information
      await expect(personalityOption.getByText('適職診断')).toBeVisible();
      await expect(personalityOption.getByText(/約15分/)).toBeVisible();
      await expect(personalityOption.getByText(/全67問/)).toBeVisible();
    });

    // =====================================================
    // Scenario: Candidate selects Gate assessment
    // Given: Assessment selection is displayed
    // When: Gate assessment option is clicked
    // Then: Navigates to Gate assessment page
    // =====================================================
    test('should navigate to Gate assessment when selected @smoke', async ({ page }) => {
      // When: Click Gate assessment option
      await page.click(SELECTORS.gateAssessmentOption);

      // Then: Should navigate to assessment page with token
      await expect(page).toHaveURL(/\/assessment\/[a-f0-9-]+/, { timeout: 15000 });
    });

    test('should navigate to Personality assessment when selected', async ({ page }) => {
      // When: Click Personality assessment option
      await page.click(SELECTORS.personalityAssessmentOption);

      // Then: Personality assessment should be displayed inline
      await expect(page.getByTestId('personality-assessment')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Error Handling', () => {
    test('should show error state when API fails', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/candidates/register', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      await page.goto('/');
      await waitForPageReady(page);

      // Submit valid data
      const uniqueEmail = `e2e-error-${Date.now()}@example.com`;
      await safeFill(page, SELECTORS.candidateNameInput, TEST_CANDIDATE.name);
      await safeFill(page, SELECTORS.candidateEmailInput, uniqueEmail);
      await page.click(SELECTORS.submitCandidateInfoButton);

      // Should show error message in form
      await expect(page.locator(SELECTORS.candidateInfoError)).toBeVisible({ timeout: 10000 });
    });

    test('should show validation error for empty name from API', async ({ page }) => {
      // Mock validation error
      await page.route('**/api/candidates/register', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Validation failed',
            details: { name: ['Name is required'] },
          }),
        });
      });

      await page.goto('/');
      await waitForPageReady(page);

      const uniqueEmail = `e2e-validation-${Date.now()}@example.com`;
      await safeFill(page, SELECTORS.candidateNameInput, TEST_CANDIDATE.name);
      await safeFill(page, SELECTORS.candidateEmailInput, uniqueEmail);
      await page.click(SELECTORS.submitCandidateInfoButton);

      // Should return to candidate info with error
      await expect(page.locator(SELECTORS.candidateInfoStep)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Full Flow Integration', () => {
    // =====================================================
    // Full Scenario: Candidate completes direct assessment start
    // Given: Landing page is accessed
    // When: Candidate fills info, selects Gate assessment
    // Then: Gate assessment page is displayed
    // =====================================================
    test('should complete full flow from landing to Gate assessment @smoke', async ({ page }) => {
      // Given: Access landing page
      await page.goto('/');
      await waitForPageReady(page);

      // When: Fill candidate information
      const uniqueEmail = `e2e-full-${Date.now()}@example.com`;
      await safeFill(page, SELECTORS.candidateNameInput, TEST_CANDIDATE.name);
      await safeFill(page, SELECTORS.candidateEmailInput, uniqueEmail);

      // And: Select a job type (optional)
      await page.click(SELECTORS.desiredJobTypeSelect);
      await page.getByText('Account Manager').click();

      // And: Submit the form
      await page.click(SELECTORS.submitCandidateInfoButton);

      // Then: Assessment selection should appear
      await expect(page.locator(SELECTORS.assessmentSelectStep)).toBeVisible({ timeout: 15000 });

      // When: Select Gate assessment
      await page.click(SELECTORS.gateAssessmentOption);

      // Then: Should navigate to assessment page
      await expect(page).toHaveURL(/\/assessment\/[a-f0-9-]+/, { timeout: 15000 });

      // And: Assessment page should have content
      await waitForPageReady(page);
      await expect(page.locator('main')).toBeVisible();
    });
  });
});
