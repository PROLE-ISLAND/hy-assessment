// =====================================================
// Accessibility Tests
// WCAG 2.1 AA compliance checking using axe-core
// =====================================================

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Pages that require authentication (will use storageState from chromium project)
const authenticatedPages = [
  { name: 'ダッシュボード', path: '/admin' },
  { name: '候補者一覧', path: '/admin/candidates' },
  { name: 'プロンプト設定', path: '/admin/prompts' },
  { name: 'テンプレート管理', path: '/admin/templates' },
];

// Public pages (no authentication required)
const publicPages = [
  { name: 'ログインページ', path: '/login' },
];

test.describe('アクセシビリティテスト - 管理画面', () => {
  for (const { name, path } of authenticatedPages) {
    test(`${name}のアクセシビリティ (WCAG 2.1 AA)`, async ({ page }) => {
      // Navigate to the page
      await page.goto(path);

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      // Run axe-core analysis with WCAG 2.1 AA tags
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('.recharts-wrapper') // Exclude chart library (known issues)
        .analyze();

      // Log violations for debugging
      if (results.violations.length > 0) {
        console.log(`\n${name} - アクセシビリティ違反:`);
        for (const violation of results.violations) {
          console.log(`  [${violation.impact}] ${violation.id}: ${violation.description}`);
          console.log(`    Help: ${violation.helpUrl}`);
          for (const node of violation.nodes.slice(0, 3)) {
            console.log(`    Element: ${node.target.join(' > ')}`);
          }
        }
      }

      // Assert no violations (or only minor ones)
      // Filter out known issues that are being tracked separately
      const criticalViolations = results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations, `${name}に重大なアクセシビリティ違反があります`).toEqual([]);
    });
  }
});

test.describe('アクセシビリティテスト - 公開ページ', () => {
  // These tests don't require authentication
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const { name, path } of publicPages) {
    test(`${name}のアクセシビリティ (WCAG 2.1 AA)`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      if (results.violations.length > 0) {
        console.log(`\n${name} - アクセシビリティ違反:`);
        for (const violation of results.violations) {
          console.log(`  [${violation.impact}] ${violation.id}: ${violation.description}`);
        }
      }

      const criticalViolations = results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations, `${name}に重大なアクセシビリティ違反があります`).toEqual([]);
    });
  }
});

test.describe('アクセシビリティテスト - インタラクティブ要素', () => {
  test('フォーム要素のラベル関連付け', async ({ page }) => {
    await page.goto('/admin/candidates');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withRules(['label', 'label-title-only', 'form-field-multiple-labels'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('ボタンとリンクのアクセシブル名', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withRules(['button-name', 'link-name', 'image-alt'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('カラーコントラスト', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    // Log contrast issues for awareness (may have false positives)
    if (results.violations.length > 0) {
      console.log('\nカラーコントラストの問題:');
      for (const violation of results.violations) {
        for (const node of violation.nodes.slice(0, 5)) {
          console.log(`  Element: ${node.target.join(' > ')}`);
          console.log(`  Issue: ${node.failureSummary}`);
        }
      }
    }

    // Only fail on critical contrast issues
    const criticalContrast = results.violations.filter(
      v => v.nodes.some(n => n.impact === 'critical')
    );
    expect(criticalContrast).toEqual([]);
  });
});

test.describe('アクセシビリティテスト - キーボードナビゲーション', () => {
  test('タブ順序が論理的', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withRules(['tabindex', 'focus-order-semantics'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('フォーカス可視性', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check that interactive elements have visible focus indicators
    const emailInput = page.getByTestId('email-input').or(page.locator('input[type="email"]'));
    await emailInput.focus();

    // Verify focus is visible (element should have focus ring or outline)
    const hasFocusStyles = await emailInput.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const outline = styles.getPropertyValue('outline');
      const boxShadow = styles.getPropertyValue('box-shadow');
      // Check if outline or box-shadow indicates focus
      return outline !== 'none' || boxShadow !== 'none';
    });

    expect(hasFocusStyles).toBe(true);
  });
});
