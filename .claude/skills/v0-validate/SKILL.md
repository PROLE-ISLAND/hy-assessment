---
name: v0-validate
description: /v0-validate - V0コンポーネント検証ウィザード
context: fork
arguments:
  - name: file_path
    description: 検証対象のコンポーネントファイルパス
    required: false
  - name: with_e2e
    description: E2Eテスト生成を含める
    required: false
    default: "false"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(npx tsc:*)
  - Bash(npm run lint:*)
  - Write
  - AskUserQuestion
skills:
  - e2e-generator
---

# /v0-validate - V0コンポーネント検証ウィザード

このコマンドは、V0で生成したUIコンポーネントを検証するためのウィザードです。

## 実行フロー

### Step 1: 検証対象の確認

ユーザーに以下を確認してください：

| 項目 | 説明 |
|------|------|
| **コンポーネントファイル** | src/components/xxx/ComponentName.tsx |
| **V0 Link** | https://v0.dev/chat/xxx（任意） |
| **Preview URL** | Vercel Preview URL（任意） |

### Step 2: コンポーネント分析

対象ファイルを読み込み、以下を分析：

```bash
# ファイル読み込み
Read: src/components/{category}/{ComponentName}.tsx

# data-testid 抽出
grep -o 'data-testid="[^"]*"' src/components/{category}/{ComponentName}.tsx
```

### Step 3: バリアントチェック

以下のチェックリストで検証：

```markdown
## バリアント検証チェックリスト

### 必須バリアント（4種類）

| バリアント | data-testid | 存在 | 内容 |
|-----------|-------------|------|------|
| Default | `{kebab-name}` | ✅/❌ | 正常データ表示 |
| Loading | `{kebab-name}-skeleton` | ✅/❌ | スケルトンUI |
| Empty | `{kebab-name}-empty` | ✅/❌ | 空状態メッセージ |
| Error | `{kebab-name}-error` | ✅/❌ | エラー + 再試行 |

### コード品質

- [ ] Props型が定義されている
- [ ] 早期リターンパターンで実装
- [ ] TypeScriptエラーなし
- [ ] ESLintエラーなし

### デザインシステム準拠

- [ ] shadcn/ui コンポーネント使用
- [ ] Tailwind CSS使用（ハードコード色なし）
- [ ] ダークモード対応（dark:クラス）
- [ ] 日本語テキスト
```

### Step 4: アクセシビリティチェック

以下のa11y観点を確認：

```markdown
## a11y チェックリスト

### 必須項目
- [ ] ボタンにaria-labelまたはテキストあり
- [ ] 画像にalt属性あり
- [ ] フォーム要素にlabel関連付けあり
- [ ] 色のみに依存しない情報伝達

### 推奨項目
- [ ] キーボード操作可能
- [ ] フォーカス状態が視認可能
- [ ] 適切な見出し階層
- [ ] 十分なコントラスト比
```

### Step 5: E2Eテスト生成（オプション）

ユーザーに確認：「E2Eテストを自動生成しますか？」

**生成する場合:**

```typescript
// e2e/components/{component-name}.spec.ts

import { test, expect } from '@playwright/test';

test.describe('{ComponentName} コンポーネント', () => {

  test.describe('Default バリアント', () => {
    test('正常データが表示される', async ({ page }) => {
      await page.goto('/path-to-component');
      await expect(page.locator('[data-testid="{kebab-name}"]')).toBeVisible();
    });
  });

  test.describe('Loading バリアント', () => {
    test('ローディング中はスケルトンが表示される', async ({ page }) => {
      await page.route('**/api/**', route => route.abort());
      await page.goto('/path-to-component');
      await expect(page.locator('[data-testid="{kebab-name}-skeleton"]')).toBeVisible();
    });
  });

  test.describe('Empty バリアント', () => {
    test('データなし時は空状態が表示される', async ({ page }) => {
      await page.route('**/api/**', route =>
        route.fulfill({ json: [] })
      );
      await page.goto('/path-to-component');
      await expect(page.locator('[data-testid="{kebab-name}-empty"]')).toBeVisible();
    });
  });

  test.describe('Error バリアント', () => {
    test('エラー時はエラー状態が表示される', async ({ page }) => {
      await page.route('**/api/**', route =>
        route.fulfill({ status: 500 })
      );
      await page.goto('/path-to-component');
      await expect(page.locator('[data-testid="{kebab-name}-error"]')).toBeVisible();
      await expect(page.getByRole('button', { name: /再試行|リトライ/i })).toBeVisible();
    });
  });

});
```

### Step 6: 検証レポート生成

```markdown
## V0コンポーネント検証レポート

**対象**: {ComponentName}
**ファイル**: src/components/{category}/{ComponentName}.tsx
**検証日時**: {datetime}

### バリアント検証結果

| 項目 | 結果 |
|------|------|
| Default | ✅ Pass |
| Loading | ✅ Pass |
| Empty | ✅ Pass |
| Error | ✅ Pass |

### 品質チェック結果

| 項目 | 結果 |
|------|------|
| TypeScript | ✅ エラーなし |
| ESLint | ✅ エラーなし |
| デザインシステム | ✅ 準拠 |
| a11y | ✅ 基本項目OK |

### 次のステップ

1. Vercel Preview で目視確認
2. Vercel Toolbar で a11y 監査実行
3. `/design-approve` でデザイン承認申請
```

### Step 7: 次のステップ案内

```markdown
## 検証完了

### 検証結果: ✅ PASS / ❌ FAIL

### 次のステップ
- **PASS の場合**: `/design-approve` でデザイン承認を申請
- **FAIL の場合**: 問題箇所を修正し、再度 `/v0-validate` を実行
```
