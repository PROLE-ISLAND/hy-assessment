/**
 * Deterministic Wait Helpers for Playwright E2E Tests
 *
 * These helpers eliminate flaky tests by using deterministic wait strategies
 * instead of arbitrary timeouts. Based on Autonomous E2E improvement patterns.
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * Wait for page to be fully ready (DOM + hydration)
 * Use after navigation or significant state changes
 */
export async function waitForPageReady(page: Page): Promise<void> {
  // Wait for DOM content to be loaded
  await page.waitForLoadState('domcontentloaded');

  // Wait for network to be idle (no pending requests)
  await page.waitForLoadState('networkidle');

  // Wait for Next.js hydration to complete
  await page.waitForFunction(() => {
    // Check readyState
    if (document.readyState !== 'complete') return false;

    // Check for loading indicators
    const loadingIndicators = document.querySelectorAll(
      '[data-loading="true"], [data-skeleton], .loading, .skeleton'
    );
    if (loadingIndicators.length > 0) return false;

    // Check for pending React hydration (Next.js specific)
    const hydrating = document.querySelector('[data-reactroot]');
    if (hydrating && !document.body.classList.contains('hydrated')) {
      // Give it a moment for hydration
      return false;
    }

    return true;
  }, { timeout: 10000 }).catch(() => {
    // Fallback: if function times out, page is likely ready
  });
}

/**
 * Wait for an element to be stable (not moving, not changing)
 * Use before clicking or interacting with elements
 */
export async function waitForElementStable(
  locator: Locator,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 10000;

  // Wait for element to be visible
  await locator.waitFor({ state: 'visible', timeout });

  // Wait for element to stop moving/resizing
  await locator.evaluate(async (el) => {
    return new Promise<void>((resolve) => {
      let lastRect = el.getBoundingClientRect();
      let stableCount = 0;
      const requiredStableFrames = 3;

      const checkStability = () => {
        const currentRect = el.getBoundingClientRect();
        const isStable =
          lastRect.x === currentRect.x &&
          lastRect.y === currentRect.y &&
          lastRect.width === currentRect.width &&
          lastRect.height === currentRect.height;

        if (isStable) {
          stableCount++;
          if (stableCount >= requiredStableFrames) {
            resolve();
            return;
          }
        } else {
          stableCount = 0;
          lastRect = currentRect;
        }

        requestAnimationFrame(checkStability);
      };

      requestAnimationFrame(checkStability);
    });
  });
}

/**
 * Safe click - waits for element stability before clicking
 * Prevents "element is moving" or "element detached" errors
 */
export async function safeClick(
  page: Page,
  selector: string,
  options?: { timeout?: number; force?: boolean }
): Promise<void> {
  const locator = page.locator(selector).first();
  const timeout = options?.timeout ?? 10000;

  // Wait for element to be visible and stable
  await locator.waitFor({ state: 'visible', timeout });

  // Scroll into view if needed
  await locator.scrollIntoViewIfNeeded();

  // Wait for stability
  await waitForElementStable(locator, { timeout: 5000 });

  // Click
  await locator.click({ force: options?.force });
}

/**
 * Safe fill - clears and fills input reliably
 * Handles autofocus and validation timing
 */
export async function safeFill(
  page: Page,
  selector: string,
  value: string,
  options?: { timeout?: number; clear?: boolean }
): Promise<void> {
  const locator = page.locator(selector).first();
  const timeout = options?.timeout ?? 10000;

  // Wait for element to be visible
  await locator.waitFor({ state: 'visible', timeout });

  // Focus the element
  await locator.focus();

  // Clear if needed (default: true)
  if (options?.clear !== false) {
    await locator.clear();
  }

  // Fill the value
  await locator.fill(value);

  // Wait for input event to be processed (blur triggers validation)
  await locator.blur();
}

/**
 * Wait for navigation to complete after an action
 * Use after clicking links or submitting forms
 */
export async function waitForNavigation(
  page: Page,
  action: () => Promise<void>,
  options?: { timeout?: number; waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }
): Promise<void> {
  const timeout = options?.timeout ?? 30000;
  const waitUntil = options?.waitUntil ?? 'networkidle';

  await Promise.all([
    page.waitForLoadState(waitUntil, { timeout }),
    action(),
  ]);
}

/**
 * Wait for data to load (e.g., table rows, list items)
 * Use when waiting for async data fetching
 */
export async function waitForData(
  page: Page,
  selector: string,
  options?: { minCount?: number; timeout?: number }
): Promise<number> {
  const minCount = options?.minCount ?? 1;
  const timeout = options?.timeout ?? 30000;

  // Wait for at least minCount elements
  await page.waitForFunction(
    ([sel, min]) => {
      const elements = document.querySelectorAll(sel as string);
      return elements.length >= (min as number);
    },
    [selector, minCount] as const,
    { timeout }
  );

  // Return actual count
  return await page.locator(selector).count();
}

/**
 * Wait for toast/notification to appear and optionally disappear
 * Common pattern in form submissions
 */
export async function waitForToast(
  page: Page,
  options?: {
    text?: string | RegExp;
    type?: 'success' | 'error' | 'info' | 'warning';
    waitForDismiss?: boolean;
    timeout?: number;
  }
): Promise<void> {
  const timeout = options?.timeout ?? 10000;

  // Common toast selectors
  const toastSelectors = [
    '[role="alert"]',
    '[data-sonner-toast]',
    '.toast',
    '.notification',
    '[data-testid*="toast"]',
  ];

  // Wait for any toast to appear
  const toastLocator = page.locator(toastSelectors.join(', ')).first();
  await toastLocator.waitFor({ state: 'visible', timeout });

  // Check text if specified
  if (options?.text) {
    await expect(toastLocator).toContainText(options.text);
  }

  // Wait for dismiss if requested
  if (options?.waitForDismiss) {
    await toastLocator.waitFor({ state: 'hidden', timeout });
  }
}

/**
 * Wait for modal/dialog to be fully visible
 */
export async function waitForModal(
  page: Page,
  options?: { selector?: string; timeout?: number }
): Promise<Locator> {
  const timeout = options?.timeout ?? 10000;

  // Common modal selectors
  const selector = options?.selector ?? [
    '[role="dialog"]',
    '[role="alertdialog"]',
    '[data-state="open"]',
    '.modal',
    '[data-testid*="modal"]',
    '[data-testid*="dialog"]',
  ].join(', ');

  const modal = page.locator(selector).first();
  await modal.waitFor({ state: 'visible', timeout });

  // Wait for modal to stop animating
  await waitForElementStable(modal, { timeout: 2000 });

  return modal;
}

/**
 * Dismiss modal reliably
 */
export async function dismissModal(
  page: Page,
  options?: { clickOutside?: boolean; pressEscape?: boolean }
): Promise<void> {
  if (options?.pressEscape !== false) {
    await page.keyboard.press('Escape');
  } else if (options?.clickOutside) {
    // Click outside modal
    await page.locator('[data-overlay], .overlay, [role="dialog"] ~ div').first().click();
  }

  // Wait for modal to disappear
  await page.locator('[role="dialog"], [role="alertdialog"]').first()
    .waitFor({ state: 'hidden', timeout: 5000 })
    .catch(() => { /* Modal might already be gone */ });
}

/**
 * Retry action with exponential backoff
 * Use for flaky operations like API calls
 */
export async function retryAction<T>(
  action: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const initialDelayMs = options?.initialDelayMs ?? 1000;
  const maxDelayMs = options?.maxDelayMs ?? 10000;
  const backoffMultiplier = options?.backoffMultiplier ?? 2;

  let lastError: Error | undefined;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Wait for specific URL pattern
 */
export async function waitForUrl(
  page: Page,
  urlPattern: string | RegExp,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 30000;
  await page.waitForURL(urlPattern, { timeout });
}

/**
 * Take screenshot with meaningful name for debugging
 */
export async function debugScreenshot(
  page: Page,
  name: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `test-results/debug-${name}-${timestamp}.png`,
    fullPage: true,
  });
}
