---
name: dev
description: 実装PRを作成。DoD準拠テスト自動生成、カバレッジ検証、E2Eテスト連携対応
context: fork
arguments:
  - name: req_pr_number
    description: 要件定義PR番号（例: 45）
    required: true
  - name: issue_number
    description: 対象Issue番号（例: 123）
    required: true
  - name: feature_name
    description: 機能名（ブランチ名に使用）
    required: true
  - name: agents
    description: 使用するエージェント（auto/frontend,backend,devops）
    required: false
    default: "auto"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash(git:*)
  - Bash(gh pr:*)
  - Bash(gh issue:*)
  - Bash(npm:*)
  - Bash(npx:*)
  - Bash(pnpm:*)
  - Bash(mkdir:*)
  - Task
  - AskUserQuestion
skills:
  - code-review
  - e2e-testing
  - e2e-generator
hooks:
  PreToolUse:
    - matcher: "Bash(gh pr create:*)"
      hooks:
        - type: command
          command: "python3 /Users/RyuichiAida/.claude/hooks/dod-check.py"
          timeout: 10000
---

# /dev - 実装PR作成ウィザード

DoD基準に準拠した実装PRを作成するウィザード。

## 実行フロー

### Step 1: 要件定義PR確認・読み込み

1. **要件定義PRがある場合**: PR番号を教えてください（例: #45）
2. **要件定義PRがない場合**: `/req` を先に実行
3. **要件定義不要の場合**: バグ修正・ドキュメント等 → Step 2へ

```bash
# PR本文を取得して要件を確認
gh pr view {req_pr番号} --json body -q '.body' > /tmp/requirements.md
```

### Step 1.5: デザイン承認確認（UI機能の場合）⚠️ 必須

```bash
# 要件定義PRのラベルを確認
gh pr view {req_pr番号} --json labels -q '.labels[].name'
```

| ラベル状態 | 対応 |
|-----------|------|
| `design-approved` あり | ✅ 実装開始OK |
| `design-review` あり | ❌ デザイン承認待ち |
| `no-ui` あり | ✅ バックエンドのみ |

### Step 2: ブランチ作成

```bash
git checkout -b feature/issue-{番号}-{機能名}
```

### Step 3: 実装

要件定義PRの内容に従って実装。

### Step 3.5: Storybookストーリー生成（UI機能の場合）⚠️ 必須

**コンポーネント作成時、同時にStorybookストーリーを生成:**

```bash
# コンポーネントファイルと同階層にストーリーを作成
cat > src/components/{ComponentName}/{ComponentName}.stories.tsx << 'EOF'
import type { Meta, StoryObj } from '@storybook/react';
import { {ComponentName} } from './{ComponentName}';

const meta: Meta<typeof {ComponentName}> = {
  title: 'Components/{ComponentName}',
  component: {ComponentName},
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};
export default meta;

type Story = StoryObj<typeof {ComponentName}>;

// Default - 正常データ表示
export const Default: Story = {
  args: {
    data: mockData,
  },
};

// Loading - ローディング状態
export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

// Empty - データなし状態
export const Empty: Story = {
  args: {
    data: [],
  },
};

// Error - エラー状態
export const Error: Story = {
  args: {
    error: new Error('Failed to load data'),
  },
};
EOF
```

**Storybook動作確認:**

```bash
# Storybookを起動して確認（オプション）
npm run storybook

# または、Storybook静的ビルド
npm run build-storybook
```

### Step 3.6: variant-check 実行（Silver/Gold）

```bash
# /variant-check スキルを使用してバリアント完全性を検証
/variant-check target=src/components/{ComponentName} storybook=true
```

**合格基準:**
- [ ] 4バリアント（DLEE）すべて実装
- [ ] Storybookストーリーが各バリアントに対応
- [ ] data-testid が付与されている

### Step 4: コードレビュー自動実行（/code-review統合）

実装完了後、`/code-review` スキルでレビューを実行:

```bash
# 変更ファイルをレビュー（外部API不要）
/code-review target=src/components/NewFeature.tsx policy=standard dod=silver
```

**セキュリティチェック:**

```bash
# セキュリティ重視のレビュー
/code-review target=src/app/api policy=security
```

**レビュー内容:**
- TypeScript型チェック（`npx tsc --noEmit`）
- ESLint（`npx eslint`）
- セキュリティパターン検索（Grep）
- Claude によるコード分析

### Step 5: テストファイル作成 ⚠️ 必須

DoD Level に応じてテストファイルの追加が必須:
- **Bronze**: 警告のみ
- **Silver**: テストファイル追加必須（ブロック）
- **Gold**: テストファイル + E2E + 統合テスト必須（ブロック）

#### 5.0 テストファイル生成コマンド

```bash
# 単体テスト雛形
cat > src/lib/{feature}/__tests__/{function}.test.ts << 'EOF'
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { {functionName} } from '../{function}';

describe('{functionName}', () => {
  // 正常系
  it('should {expected} when {case}', () => {
    expect({functionName}({input})).toBe({expected});
  });

  // 異常系
  it('should throw when {case}', () => {
    expect(() => {functionName}({input})).toThrow();
  });
});
EOF
```

#### 5.1 E2Eテスト（Gold対象）

```bash
cat > e2e/{feature}.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('{Feature名}', () => {
  test('{シナリオ名}', async ({ page }) => {
    await page.goto('/{path}');
    await page.click('[data-testid="{xxx-button}"]');
    await expect(page.getByText('{expected}')).toBeVisible();
  });
});
EOF
```

### Step 6: DoD チェック

```bash
# Bronze
npm run lint && npx tsc --noEmit && npm run test:run && npm run build

# Silver
npm run check:silver

# Gold
npm run check:gold && npm run test:e2e
```

### Step 7: PR作成

```bash
gh pr create \
  --title "{type}: {機能名}" \
  --body-file /tmp/claude-cmd-dev.md \
  --label type:implementation
```

## 観点チェックリスト

### 要件トレース ⚠️ 最重要
- [ ] 要件定義PR（Phase 2.2）のUC一覧を全てカバー
- [ ] Pre-mortem（Phase 3.2）の失敗シナリオ対策が実装
- [ ] GWT仕様（Phase 5.3）からE2Eテストを作成
- [ ] 単体テスト設計（Phase 5.4）からVitestを作成
- [ ] 統合テスト設計（Phase 5.6）から統合テストを作成

### コード品質
- [ ] lint/format 通過
- [ ] 型チェック通過
- [ ] ビルド成功

### UI品質（該当時）
- [ ] 全バリアント実装（Default/Loading/Empty/Error）
- [ ] Storybookストーリーが作成されている
- [ ] `/variant-check` が合格
- [ ] data-testid が付与されている
- [ ] アクセシビリティ考慮（aria-label等）
