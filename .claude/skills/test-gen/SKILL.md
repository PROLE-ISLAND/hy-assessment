---
name: test-gen
description: 既存コードにテストを自動生成。Unit/Integration/E2E対応、カバレッジ向上支援
context: fork
arguments:
  - name: target
    description: テスト生成対象（ファイルパス/ディレクトリ/glob）
    required: true
  - name: type
    description: テスト種別（unit/integration/e2e/all）
    required: false
    default: "unit"
  - name: coverage
    description: 目標カバレッジ（80/85/95）
    required: false
    default: "85"
  - name: framework
    description: テストフレームワーク（vitest/jest/playwright）
    required: false
    default: "vitest"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash(npm:*)
  - Bash(npx:*)
  - Bash(pnpm:*)
  - mcp__gpt5-devops__code_review
  - Task
  - TodoWrite
---

# /test-gen - テスト自動生成スキル

既存コードにテストを自動生成し、カバレッジを向上させる。

## テスト種別

| 種別 | フレームワーク | 対象 |
|------|---------------|------|
| **unit** | Vitest | 関数・ユーティリティ |
| **integration** | Vitest + MSW | API連携・状態管理 |
| **e2e** | Playwright | ユーザーフロー |

## 実行フロー

```
対象ファイル分析
  ↓
エクスポート関数抽出
  ↓
テストケース設計
  ├─ 正常系（Happy Path）
  ├─ 異常系（Error Cases）
  └─ エッジケース（Boundary）
  ↓
テストコード生成
  ↓
カバレッジ確認
```

## 生成パターン

### Unit Test (Vitest)

```typescript
// Input: src/lib/utils/format.ts
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount);
}

// Output: src/lib/utils/__tests__/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../format';

describe('formatCurrency', () => {
  // 正常系
  it('should format positive number', () => {
    expect(formatCurrency(1000)).toBe('￥1,000');
  });

  it('should format zero', () => {
    expect(formatCurrency(0)).toBe('￥0');
  });

  // 異常系
  it('should handle negative number', () => {
    expect(formatCurrency(-1000)).toBe('-￥1,000');
  });

  // エッジケース
  it('should handle large number', () => {
    expect(formatCurrency(1000000000)).toBe('￥1,000,000,000');
  });

  it('should handle decimal (rounded)', () => {
    expect(formatCurrency(1000.5)).toBe('￥1,001');
  });
});
```

### Integration Test (API)

```typescript
// Input: src/app/api/users/route.ts
// Output: src/app/api/users/__tests__/route.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '../route';

describe('GET /api/users', () => {
  it('should return users list', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it('should return 401 without auth', async () => {
    const { req } = createMocks({ method: 'GET' });
    // Remove auth header
    const response = await GET(req);

    expect(response.status).toBe(401);
  });
});

describe('POST /api/users', () => {
  it('should create user with valid data', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: { name: 'Test User', email: 'test@example.com' }
    });
    const response = await POST(req);

    expect(response.status).toBe(201);
  });

  it('should return 400 with invalid data', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: { name: '' } // invalid
    });
    const response = await POST(req);

    expect(response.status).toBe(400);
  });
});
```

### E2E Test (Playwright)

```typescript
// Input: src/app/login/page.tsx
// Output: e2e/login.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible();
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.getByLabel('メールアドレス').fill('test@example.com');
    await page.getByLabel('パスワード').fill('password123');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByLabel('メールアドレス').fill('wrong@example.com');
    await page.getByLabel('パスワード').fill('wrongpassword');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByText('メールアドレスまたはパスワードが正しくありません')).toBeVisible();
  });

  test('should show validation errors', async ({ page }) => {
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByText('メールアドレスを入力してください')).toBeVisible();
    await expect(page.getByText('パスワードを入力してください')).toBeVisible();
  });
});
```

## テストケース設計ガイドライン

### 正常系 (Happy Path)
- 期待通りの入力で期待通りの出力
- 代表的なユースケース

### 異常系 (Error Cases)
- 無効な入力
- 権限エラー
- ネットワークエラー

### エッジケース (Boundary)
- 空値、null、undefined
- 最大値、最小値
- 特殊文字
- 大量データ

## カバレッジ目標

| DoD Level | 目標 | 必須テスト |
|-----------|------|-----------|
| Bronze | 80% | Unit |
| Silver | 85% | Unit + Integration |
| Gold | 95% | Unit + Integration + E2E |

## 出力

```
生成完了:
- src/lib/utils/__tests__/format.test.ts (Unit)
- src/app/api/users/__tests__/route.test.ts (Integration)
- e2e/login.spec.ts (E2E)

カバレッジ:
- Before: 45%
- After: 87%
- Target: 85% ✅
```
