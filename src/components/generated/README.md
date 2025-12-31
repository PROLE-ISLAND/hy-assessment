# Generated Components

v0.dev で生成したコンポーネントを配置するディレクトリ。

## 使い方

1. [v0.dev](https://v0.dev) でプロンプト入力
2. 生成されたコードをこのディレクトリにコピー
3. デザインシステムに合わせて微調整
4. テスト追加

## コンポーネント登録形式

各コンポーネントファイルの冒頭に以下のコメントを記載:

```typescript
/**
 * {ComponentName}
 *
 * Generated with v0: {v0 URL}
 * Figma: {Figma URL}
 * Issue: #{Issue番号}
 *
 * Modifications:
 * - デザインシステム適用（stateColors使用）
 * - 日本語化
 * - Props型追加
 */
```

## 修正ルール

v0生成コードをそのまま使わず、以下を確認:

1. **ハードコード色の置換**
   - `text-green-600` → `stateColors.success.combined`
   - `text-red-600` → `stateColors.error.combined`
   - `text-yellow-600` → `stateColors.warning.combined`

2. **ダークモード確認**
   - `bg-white` → `bg-background`
   - `text-gray-900` → `text-foreground`

3. **日本語化**
   - ボタン、ラベル、プレースホルダーを日本語に

4. **型安全性**
   - Props interfaceを追加
   - 必要に応じてジェネリクス使用

5. **バリアント実装**
   - 全状態パターンを実装（詳細は下記）

---

## バリアント実装ガイドライン

### 必須バリアント

すべてのv0生成コンポーネントは以下のバリアントを実装すること:

| バリアント | 必須度 | 説明 | data-testid |
|-----------|--------|------|-------------|
| Default | ⚫必須 | 正常データ表示 | `{component}` |
| Loading | ⚫必須 | スケルトンUI / スピナー | `{component}-skeleton` |
| Empty | ⚫必須 | データなし状態 | `{component}-empty` |
| Error | ⚫必須 | エラー + 再試行ボタン | `{component}-error` |

### Props型定義

```typescript
interface ComponentProps {
  // データ
  data?: DataType;

  // 状態バリアント
  isLoading?: boolean;
  error?: Error | null;

  // コールバック
  onRetry?: () => void;

  // データパターン（該当する場合）
  status?: 'success' | 'warning' | 'danger';
}
```

### 実装パターン

```tsx
// 推奨: 早期リターンパターン
export function MyComponent({
  data,
  isLoading,
  error,
  onRetry
}: MyComponentProps) {
  // 1. Loading状態
  if (isLoading) {
    return <MyComponentSkeleton data-testid="my-component-skeleton" />;
  }

  // 2. Error状態
  if (error) {
    return (
      <MyComponentError
        error={error}
        onRetry={onRetry}
        data-testid="my-component-error"
      />
    );
  }

  // 3. Empty状態
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return <MyComponentEmpty data-testid="my-component-empty" />;
  }

  // 4. Default状態
  return <MyComponentDefault data={data} data-testid="my-component" />;
}
```

### ファイル構成

大きなコンポーネントは分割を推奨:

```
my-component/
├── index.tsx           # メインエクスポート（状態分岐）
├── default.tsx         # Default状態
├── skeleton.tsx        # Loading状態
├── empty.tsx           # Empty状態
├── error.tsx           # Error状態
└── types.ts            # 型定義
```

### Skeletonコンポーネント例

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export function MyComponentSkeleton() {
  return (
    <div data-testid="my-component-skeleton" className="space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
```

### Errorコンポーネント例

```tsx
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { stateColors } from '@/lib/design-system';

interface ErrorProps {
  error: Error;
  onRetry?: () => void;
}

export function MyComponentError({ error, onRetry }: ErrorProps) {
  return (
    <div
      data-testid="my-component-error"
      className="flex flex-col items-center justify-center p-6 text-center"
    >
      <AlertCircle className={`h-12 w-12 mb-4 ${stateColors.error.icon}`} />
      <p className={`mb-4 ${stateColors.error.text}`}>
        読み込みに失敗しました
      </p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          data-testid="my-component-retry-button"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          再試行
        </Button>
      )}
    </div>
  );
}
```

### Emptyコンポーネント例

```tsx
import { Inbox } from 'lucide-react';

export function MyComponentEmpty() {
  return (
    <div
      data-testid="my-component-empty"
      className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground"
    >
      <Inbox className="h-12 w-12 mb-4 opacity-50" />
      <p>データがありません</p>
    </div>
  );
}
```

---

## 登録済みコンポーネント

| コンポーネント | Issue | v0 URL | 説明 |
|---------------|-------|--------|------|
| （まだなし） | - | - | - |
