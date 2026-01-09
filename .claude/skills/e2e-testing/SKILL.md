---
name: e2e-testing
description: Playwright E2Eテスト生成・実行支援。プロジェクト自動検出、data-testidベースのセレクタ、認証フロー対応。新規テスト作成、デバッグ、カバレッジ向上に使用
context: fork
arguments:
  - name: mode
    description: 実行モード（generate/run/debug/coverage）
    required: true
  - name: target
    description: 対象（ページURL/ファイルパス/テストファイル）
    required: false
  - name: browser
    description: ブラウザ（chromium/firefox/webkit/all）
    required: false
    default: "chromium"
  - name: headed
    description: ヘッドモード実行（true/false）
    required: false
    default: "false"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash(npx playwright:*)
  - Bash(npm:*)
  - Bash(pnpm:*)
  - WebFetch
  - Task
  - TodoWrite
---

# E2E Testing Skill

## Capabilities

1. **Test Generation**: Playwrightテストファイルの作成
2. **Test Execution**: 適切な設定でのテスト実行
3. **Debugging**: テスト失敗の分析と修正提案
4. **Coverage Analysis**: 未テストのユーザーフロー特定

## Project Detection

テスト生成前にプロジェクトタイプを検出:

```bash
# 1. playwright.config.ts の場所を確認
find . -name "playwright.config.ts" -not -path "*/node_modules/*" | head -1

# 2. フレームワーク特定
# next.config.ts -> Next.js
# vite.config.ts -> Vite/React

# 3. 既存テストパターンを確認
# fixtures.ts, helpers/ ディレクトリの有無
```

## Test Structure Template

```typescript
import { test, expect } from '@playwright/test';
// プロジェクト固有のfixturesがあればインポート
// import { test, expect, SELECTORS } from './fixtures';

test.describe('[Feature Name]', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: ページ遷移、認証
  });

  test('should [expected behavior]', async ({ page }) => {
    // Arrange: テストデータ準備
    // Act: ユーザーアクション実行
    // Assert: 期待結果の検証
  });
});
```

## Selector Priority

セレクタは以下の優先順位で使用:

1. `data-testid` 属性（最も安定）
2. `role` 属性 + accessible name
3. `aria-label` 属性
4. テキストコンテンツ（最終手段）

```typescript
// Good
await page.click('[data-testid="submit-button"]');
await page.getByRole('button', { name: '送信' });

// Avoid
await page.click('.btn-primary');
await page.click('button:nth-child(2)');
```

## Authentication Pattern

storage stateを使用した認証永続化:

```typescript
// auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', process.env.E2E_TEST_EMAIL);
  await page.fill('[data-testid="login-password"]', process.env.E2E_TEST_PASSWORD);
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL('**/admin**');
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
```

## Fixtures Pattern

共通フィクスチャでテストを拡張:

```typescript
// fixtures.ts
import { test as base, expect, type Page } from '@playwright/test';

export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    // ... login logic
    await use(page);
  },
});

export { expect };

export const SELECTORS = {
  navDashboard: '[data-testid="nav-dashboard"]',
  loginEmail: '[data-testid="login-email"]',
  // ... more selectors
};
```

## Helper Functions

再利用可能なヘルパー関数:

```typescript
export async function waitForToast(page: Page) {
  return page.waitForSelector('[data-sonner-toast], [role="alert"]', { timeout: 5000 });
}

export async function login(page: Page, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await page.goto('/login');
      await page.fill(SELECTORS.loginEmail, E2E_TEST_EMAIL);
      await page.fill(SELECTORS.loginPassword, E2E_TEST_PASSWORD);
      await page.click(SELECTORS.loginSubmit);
      await page.waitForURL('/admin**', { timeout: 15000 });
      return;
    } catch (error) {
      if (attempt < retries) {
        await page.waitForTimeout(2000 * attempt);
        continue;
      }
      throw error;
    }
  }
}
```

## Best Practices

1. `page.waitForLoadState('networkidle')` をナビゲーション後に使用
2. 動的コンテンツには明示的なタイムアウトを設定
3. インタラクション前に `expect(locator).toBeVisible()` を確認
4. デバッグ用に失敗時のスクリーンショットをキャプチャ
5. テストは独立して実行可能に（テスト間で状態を共有しない）

## Test Naming Convention

番号プレフィックスで実行順序を制御:

```
e2e/
├── auth.setup.ts       # 認証セットアップ（最初に実行）
├── 01-auth.spec.ts     # 認証テスト
├── 02-candidates.spec.ts # 候補者管理
├── 03-analysis.spec.ts # 分析機能
└── fixtures.ts         # 共通フィクスチャ
```

## CI Integration

```yaml
# playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 3,  # Rate limiting対策
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ...(process.env.CI ? [['github']] : []),
  ],
});
```
