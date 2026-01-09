---
name: variant-check
description: UIコンポーネントのバリアント完全性を検証。Default/Loading/Empty/Error + Skeleton状態の実装確認
context: fork
arguments:
  - name: target
    description: 検証対象（ファイルパス/ディレクトリ/glob）
    required: true
  - name: variants
    description: 必須バリアント（カンマ区切り）
    required: false
    default: "Default,Loading,Empty,Error"
  - name: generate
    description: 不足バリアントを自動生成（true/false）
    required: false
    default: "false"
  - name: storybook
    description: Storybookストーリーも検証（true/false）
    required: false
    default: "true"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash(npm:*)
  - Task
  - TodoWrite
---

# /variant-check - UIバリアント検証スキル

UIコンポーネントの状態バリアント完全性を検証する。

## 設計思想

**AIがやりがちなミス:**
- Happy path（Default）だけ実装
- ローディング状態を忘れる
- 空データ状態を考慮しない
- エラー状態のUIがない

**あるべき姿:**
- 全ての状態をUIで表現
- ユーザーが「何が起きているか」常に分かる
- エラーからの回復手段を提供

## 必須バリアント

### 標準セット（DLEE）

| バリアント | 状態 | 必須要素 |
|-----------|------|---------|
| **Default** | 正常データ表示 | 実データ表示 |
| **Loading** | データ取得中 | スピナー or スケルトン |
| **Empty** | データなし | 「データがありません」+ 作成誘導 |
| **Error** | エラー発生 | エラーメッセージ + リトライボタン |

### 拡張セット（オプション）

| バリアント | 状態 | 用途 |
|-----------|------|------|
| **Skeleton** | 初回ロード | コンテンツのプレースホルダー |
| **Disabled** | 操作不可 | 権限なし/メンテ中 |
| **Readonly** | 読み取り専用 | 編集権限なし |
| **Partial** | 部分ロード | 大量データの段階表示 |

## 検証ロジック

### コンポーネント分析

```typescript
// 検出パターン
const VARIANT_PATTERNS = {
  Default: [
    /return\s*\(/,  // 通常のreturn
    /data\./,       // dataの使用
  ],
  Loading: [
    /isLoading/,
    /loading/,
    /Spinner/,
    /Skeleton/,
    /\.\.\.loading/,
  ],
  Empty: [
    /isEmpty/,
    /\.length\s*===\s*0/,
    /!data/,
    /データがありません/,
    /No\s+data/i,
  ],
  Error: [
    /isError/,
    /error/,
    /Error/,
    /catch/,
    /リトライ/,
    /retry/i,
  ],
};
```

### Storybook検証

```typescript
// ストーリー存在確認
const STORY_PATTERNS = {
  Default: /export\s+const\s+Default/,
  Loading: /export\s+const\s+Loading/,
  Empty: /export\s+const\s+Empty/,
  Error: /export\s+const\s+Error/,
};
```

## 実行フロー

```
/variant-check target=src/components/**/*.tsx
  ↓
1. 対象ファイル収集
   Glob: src/components/**/*.tsx
  ↓
2. コンポーネント解析
   ├─ Props型からデータ状態を推測
   ├─ 条件分岐からバリアント検出
   └─ レンダリング出力を分析
  ↓
3. Storybook検証（storybook=true）
   ├─ *.stories.tsx 存在確認
   └─ 各バリアントのストーリー存在確認
  ↓
4. 不足バリアント特定
  ↓
5. レポート生成
   ├─ generate=false → 不足リスト表示
   └─ generate=true → 自動生成
```

## 出力レポート

```markdown
## 🎨 Variant Check Report

### Summary
- **Files Checked**: 12
- **Complete**: 8 (67%)
- **Incomplete**: 4 (33%)

### Results

| Component | Default | Loading | Empty | Error | Storybook |
|-----------|:-------:|:-------:|:-----:|:-----:|:---------:|
| UserList | ✅ | ✅ | ❌ | ❌ | ⚠️ 2/4 |
| ProductCard | ✅ | ✅ | ✅ | ✅ | ✅ 4/4 |
| OrderTable | ✅ | ❌ | ❌ | ❌ | ❌ 1/4 |
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ 4/4 |

### Missing Variants

#### UserList.tsx
- ❌ **Empty**: データなし状態の表示がない
- ❌ **Error**: エラー状態の表示がない

**推奨実装:**
```tsx
// Empty state
if (!users || users.length === 0) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Users className="mx-auto h-12 w-12 mb-4" />
      <p>ユーザーがいません</p>
      <Button variant="outline" className="mt-4">
        ユーザーを追加
      </Button>
    </div>
  );
}

// Error state
if (error) {
  return (
    <div className="text-center py-8 text-destructive">
      <AlertCircle className="mx-auto h-12 w-12 mb-4" />
      <p>読み込みに失敗しました</p>
      <Button variant="outline" className="mt-4" onClick={refetch}>
        リトライ
      </Button>
    </div>
  );
}
```

#### OrderTable.tsx
- ❌ **Loading**: ローディング状態がない
- ❌ **Empty**: 空状態がない
- ❌ **Error**: エラー状態がない

### Storybook Gaps

| Component | Missing Stories |
|-----------|-----------------|
| UserList | Empty, Error |
| OrderTable | Loading, Empty, Error |

### Next Steps
- [ ] UserList に Empty/Error 状態追加
- [ ] OrderTable に Loading/Empty/Error 状態追加
- [ ] 対応するStorybookストーリー追加
- [ ] 再検証: `/variant-check target=src/components`
```

## 自動生成テンプレート

### Empty State

```tsx
// generate=true で自動挿入
if (!data || data.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Icon className="h-12 w-12 mb-4" />
      <p className="text-lg font-medium">データがありません</p>
      <p className="text-sm mt-1">新しいアイテムを作成してください</p>
      <Button variant="outline" className="mt-4">
        作成する
      </Button>
    </div>
  );
}
```

### Loading State

```tsx
if (isLoading) {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
```

### Error State

```tsx
if (error) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-destructive">
      <AlertCircle className="h-12 w-12 mb-4" />
      <p className="text-lg font-medium">エラーが発生しました</p>
      <p className="text-sm mt-1 text-muted-foreground">
        {error.message || '予期しないエラーが発生しました'}
      </p>
      <Button variant="outline" className="mt-4" onClick={() => refetch()}>
        リトライ
      </Button>
    </div>
  );
}
```

### Storybook Stories

```tsx
// ComponentName.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'Components/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    data: mockData,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    data: [],
  },
};

export const Error: Story = {
  args: {
    error: new Error('Failed to load data'),
  },
};
```

## 使用例

```bash
# 単一コンポーネント検証
/variant-check target=src/components/UserList.tsx

# ディレクトリ全体
/variant-check target=src/components/**/*.tsx

# 自動生成付き
/variant-check target=src/components/UserList.tsx generate=true

# カスタムバリアント
/variant-check target=src/components variants=Default,Loading,Empty,Error,Skeleton

# Storybookスキップ
/variant-check target=src/components storybook=false
```

## 品質基準との連携

| DoD Level | バリアント要件 |
|-----------|---------------|
| Bronze | 検証なし（推奨のみ） |
| Silver | DLEE必須（UI変更時） |
| Gold | DLEE + Storybook必須 |

```bash
# quality-gate から自動呼び出し
/quality-gate level=Silver
  → UI変更検出時に自動で variant-check 実行
```
