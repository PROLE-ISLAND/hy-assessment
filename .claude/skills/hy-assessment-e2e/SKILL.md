---
name: hy-assessment-e2e
description: HY Assessment専用E2Eテストスキル。Supabase認証、候補者管理、分析機能のテスト支援。storage state永続化、fixtures.tsパターン対応
---

# HY Assessment E2E Testing

## Project Configuration

| 設定項目 | 値 |
|---------|---|
| Base URL | `http://localhost:3000` (dev) / `process.env.BASE_URL` |
| Test Directory | `e2e/` |
| Auth File | `e2e/.auth/user.json` |
| Fixtures | `e2e/fixtures.ts` |
| Config | `playwright.config.ts` |

## Authentication Setup

storage stateを使用した認証永続化:

```typescript
// e2e/auth.setup.ts
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

## Key Selectors

`e2e/fixtures.ts`から抽出したセレクタ:

```typescript
export const SELECTORS = {
  // Navigation
  navDashboard: '[data-testid="nav-dashboard"]',
  navCandidates: '[data-testid="nav-candidates"]',
  navCompare: '[data-testid="nav-compare"]',
  navReports: '[data-testid="nav-reports"]',
  navTemplates: '[data-testid="nav-templates"]',
  navPrompts: '[data-testid="nav-prompts"]',
  navSettings: '[data-testid="nav-settings"]',

  // Login
  loginEmail: '[data-testid="login-email"]',
  loginPassword: '[data-testid="login-password"]',
  loginSubmit: '[data-testid="login-submit"]',
  loginError: '[data-testid="login-error"]',

  // Candidates
  addCandidateButton: '[data-testid="add-candidate-button"]',
  candidateName: '[data-testid="candidate-name"]',
  candidateEmail: '[data-testid="candidate-email"]',
  candidateSubmit: '[data-testid="candidate-submit"]',
  candidateCancel: '[data-testid="candidate-cancel"]',
  selectAllButton: '[data-testid="select-all-button"]',
  compareButton: '[data-testid="compare-button"]',

  // Compare
  comparePositionFilter: '[data-testid="compare-position-filter"]',
  compareSelectAllButton: '[data-testid="compare-select-all-button"]',

  // Prompts
  promptCreateButton: '[data-testid="prompt-create-button"]',
};
```

## Helper Functions

`e2e/fixtures.ts`で定義されたヘルパー:

```typescript
// Toast通知を待機
await waitForToast(page);

// ナビゲーションとクリックを同時実行
await clickAndWaitForNavigation(page, SELECTORS.navCandidates);

// リトライ付きログイン
await login(page, 3);

// 新規候補者フォームへ遷移
await navigateToNewCandidateForm(page);
```

## Test Naming Convention

番号プレフィックスで実行順序を制御:

```
e2e/
├── auth.setup.ts       # 認証セットアップ（最初に実行）
├── 01-auth.spec.ts     # 認証テスト
├── 02-candidates.spec.ts # 候補者管理
├── 03-analysis.spec.ts # 分析機能
├── 04-compare.spec.ts  # 比較機能
├── 05-reports.spec.ts  # レポート機能
├── 06-settings.spec.ts # 設定機能
├── 07-navigation.spec.ts # ナビゲーション
└── fixtures.ts         # 共通フィクスチャ
```

## CI Integration

### Environment Variables

```bash
E2E_TEST_EMAIL      # テスト用メールアドレス
E2E_TEST_PASSWORD   # テスト用パスワード
BASE_URL            # テスト対象URL
VERCEL_AUTOMATION_BYPASS_SECRET  # Vercel保護バイパス
```

### Playwright Config

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'auth-tests', testMatch: /01-auth\.spec\.ts/ },
    {
      name: 'chromium',
      testIgnore: /01-auth\.spec\.ts/,
      use: { storageState: 'e2e/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
});
```

## Common Test Patterns

### 候補者追加テスト

```typescript
test('should add new candidate', async ({ page }) => {
  await navigateToNewCandidateForm(page);

  await page.fill(SELECTORS.candidateName, 'テスト太郎');
  await page.fill(SELECTORS.candidateEmail, `test-${Date.now()}@example.com`);
  await page.click(SELECTORS.candidateSubmit);

  await waitForToast(page);
  await expect(page).toHaveURL(/\/admin\/candidates$/);
});
```

### 認証テスト

```typescript
test('should redirect unauthenticated user to login', async ({ page }) => {
  // storage stateを使用しない
  await page.goto('/admin/candidates');
  await expect(page).toHaveURL(/\/login/);
});

test('should login with valid credentials', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/admin/);
});
```

### ナビゲーションテスト

```typescript
test('should navigate to all main pages', async ({ page }) => {
  const routes = [
    { selector: SELECTORS.navCandidates, url: /\/admin\/candidates/ },
    { selector: SELECTORS.navCompare, url: /\/admin\/compare/ },
    { selector: SELECTORS.navReports, url: /\/admin\/reports/ },
  ];

  for (const route of routes) {
    await clickAndWaitForNavigation(page, route.selector);
    await expect(page).toHaveURL(route.url);
  }
});
```

## Debugging Tips

1. **UI Mode**: `npm run test:e2e:ui` でブラウザ付き実行
2. **Headed**: `npx playwright test --headed` でブラウザ表示
3. **Debug**: `npx playwright test --debug` でステップ実行
4. **Trace**: 失敗時に `playwright-report/` でトレース確認
