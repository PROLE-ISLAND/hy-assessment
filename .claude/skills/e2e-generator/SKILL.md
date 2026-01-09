---
name: e2e-generator
description: ページ分析からE2Eテストを自動生成。UI要素検出、ユーザーフロー特定、カバレッジ向上。既存ページのテスト追加やカバレッジ拡大に使用
---

# E2E Test Generator Skill

## Capabilities

1. **Page Analysis**: ページのインタラクティブ要素を分析
2. **Flow Detection**: ユーザーフローを特定
3. **Test Generation**: 分析結果からテストコードを生成
4. **Coverage Expansion**: 既存テストのギャップを埋める

## Generation Workflow

### Step 1: Page Analysis

Playwright Codegenで対象ページを分析:

```bash
# インタラクティブにページを操作してセレクタを取得
npx playwright codegen http://localhost:3000/target-page
```

またはプログラムで要素を検出:

```typescript
const elements = await page.locator('[data-testid], button, a, input, select, [role]').all();
for (const el of elements) {
  const testId = await el.getAttribute('data-testid');
  const role = await el.getAttribute('role');
  const tagName = await el.evaluate(e => e.tagName);
  console.log({ testId, role, tagName });
}
```

### Step 2: Flow Identification

ユーザーフローを特定:

| フローパターン | 検出方法 |
|--------------|---------|
| ナビゲーション | `<a>`, `[role="link"]`, router links |
| フォーム送信 | `<form>`, submit buttons |
| CRUD操作 | Create/Edit/Delete buttons, modals |
| 認証フロー | login/logout links, protected routes |
| 状態変更 | toggles, checkboxes, selects |

### Step 3: Test Generation

検出されたパターンからテストを生成:

```typescript
// Auto-generated test for [Page Name]
// Generated at: ${new Date().toISOString()}
// Source: e2e-generator skill

import { test, expect } from '@playwright/test';

test.describe('[Page Name] E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/page-url');
    await page.waitForLoadState('networkidle');
  });

  // Page Load Tests
  test('should load page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Expected Title/);
    await expect(page.locator('h1')).toBeVisible();
  });

  // Form Tests (if forms detected)
  test('should handle form submission', async ({ page }) => {
    await page.fill('[data-testid="input-name"]', 'Test Value');
    await page.click('[data-testid="submit-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  // Error Handling Tests
  test('should display validation error for empty required field', async ({ page }) => {
    await page.click('[data-testid="submit-button"]');
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  // Navigation Tests (if links detected)
  test('should navigate to detail page', async ({ page }) => {
    await page.click('[data-testid="item-link"]');
    await expect(page).toHaveURL(/\/detail\//);
  });
});
```

## Page Object Model (POM) Generation

複雑なページにはPOMを生成:

```typescript
// pages/[PageName]Page.ts
import { type Page, type Locator } from '@playwright/test';

export class [PageName]Page {
  readonly page: Page;

  // Locators
  readonly heading: Locator;
  readonly submitButton: Locator;
  readonly nameInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1');
    this.submitButton = page.locator('[data-testid="submit-button"]');
    this.nameInput = page.locator('[data-testid="name-input"]');
  }

  async goto() {
    await this.page.goto('/page-url');
    await this.page.waitForLoadState('networkidle');
  }

  async fillForm(data: { name: string }) {
    await this.nameInput.fill(data.name);
  }

  async submit() {
    await this.submitButton.click();
  }
}
```

## Test Categories to Generate

### 1. Smoke Tests (必須)
- ページ読み込み
- 主要要素の表示

### 2. Functional Tests
- フォーム送信
- CRUD操作
- ナビゲーション

### 3. Error Handling Tests
- バリデーションエラー
- APIエラー
- 404ページ

### 4. Edge Cases
- 空データ
- 長い入力値
- 特殊文字

## Configuration Detection

プロジェクト設定を自動検出:

```typescript
interface ProjectConfig {
  testDir: string;
  baseURL: string;
  hasFixtures: boolean;
  authSetup: boolean;
  selectors: Record<string, string>;
}

async function detectConfig(projectPath: string): Promise<ProjectConfig> {
  // playwright.config.ts を読み込み
  // fixtures.ts の存在確認
  // auth.setup.ts の存在確認
  // 既存テストからセレクタパターンを抽出
}
```

## Output Locations

生成ファイルの配置:

```
e2e/
├── generated/              # 自動生成テスト
│   ├── home.spec.ts
│   └── dashboard.spec.ts
├── pages/                  # Page Objects
│   ├── HomePage.ts
│   └── DashboardPage.ts
└── fixtures.ts             # 共通フィクスチャ
```

## Usage Examples

### 単一ページのテスト生成

```
User: ダッシュボードページのE2Eテストを生成して
AI: [e2e-generatorスキル発動]
    1. /dashboard ページを分析
    2. 検出要素: ナビゲーション、統計カード、テーブル
    3. テスト生成: smoke, navigation, data display
```

### 複数フローのテスト生成

```
User: 候補者登録フローのテストを生成して
AI: [e2e-generatorスキル発動]
    1. フロー分析: 一覧 → 新規作成 → フォーム入力 → 確認 → 完了
    2. 各ステップのセレクタ検出
    3. E2Eテスト生成: happy path + error cases
```

## Best Practices for Generated Tests

1. **data-testid優先**: CSS class依存を避ける
2. **明示的なwait**: 暗黙的なタイミング依存を避ける
3. **独立したテスト**: テスト間で状態を共有しない
4. **意味のあるアサーション**: 単なる表示確認だけでなく内容検証
5. **エラーケース**: happy pathだけでなく異常系も生成
