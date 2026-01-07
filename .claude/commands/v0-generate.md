# /v0-generate - V0 UIコンポーネント生成ウィザード

このコマンドは、MCP v0ツールを使用してUIコンポーネントを生成するためのウィザードです。

## 実行フロー

### Step 1: 生成対象の確認

ユーザーに以下を確認してください：

| 項目 | 説明 |
|------|------|
| **コンポーネント名** | 例: ScoreCard, CandidateList |
| **用途** | 何を表示・操作するコンポーネントか |
| **関連Issue/PR** | #番号（任意） |

### Step 2: 要件の収集

以下の情報を収集してください：

```markdown
## 生成要件

### 基本情報
- **コンポーネント名**: {ComponentName}
- **用途**: {description}
- **配置先**: src/components/{category}/

### UIスペック
- **入力データ**: {props/data structure}
- **主要アクション**: {buttons, forms, etc.}
- **レスポンシブ**: モバイル対応必要か

### バリアント（必須）
- [ ] Default - 正常データ表示
- [ ] Loading - スケルトンUI
- [ ] Empty - データなし状態
- [ ] Error - エラー + 再試行ボタン
```

### Step 3: V0プロンプト生成

以下のテンプレートでV0用プロンプトを生成：

```markdown
{ComponentName}コンポーネントを作成してください。

## 基本要件
- React + TypeScript
- shadcn/ui コンポーネント使用
- Tailwind CSS
- ダークモード対応（dark:クラス使用）
- 日本語テキスト

## 機能
{description}

## バリアント（すべて作成）
1. **Default** - 正常データ表示
   - data-testid="{kebab-name}"
2. **Loading** - スケルトンUI（Skeletonコンポーネント使用）
   - data-testid="{kebab-name}-skeleton"
3. **Empty** - 「データがありません」+ アイコン
   - data-testid="{kebab-name}-empty"
4. **Error** - 「読み込みに失敗しました」+ 再試行ボタン
   - data-testid="{kebab-name}-error"

## Props型定義
```typescript
interface {ComponentName}Props {
  data?: {DataType};
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}
```

## 実装パターン
早期リターンパターンで実装：
```typescript
export function {ComponentName}({ data, isLoading, error, onRetry }: {ComponentName}Props) {
  if (isLoading) return <{ComponentName}Skeleton />;
  if (error) return <{ComponentName}Error error={error} onRetry={onRetry} />;
  if (!data) return <{ComponentName}Empty />;
  return <{ComponentName}Default data={data} />;
}
```
```

### Step 4: MCP V0ツールで生成

以下のMCPツールを使用してV0 Chatを作成：

```typescript
// MCP v0 ツールを呼び出し
mcp__v0__createChat({
  message: "{生成したプロンプト}",
  modelConfiguration: {
    modelId: "v0-1.5-lg",  // 高品質モデル
    thinking: true
  }
})
```

### Step 5: 生成結果の確認

V0から返されたコードを確認し、以下をチェック：

- [ ] 全4バリアントが生成されている
- [ ] data-testid が正しく付与されている
- [ ] shadcn/ui コンポーネントを使用している
- [ ] ダークモード対応している
- [ ] 日本語テキストになっている

### Step 6: 結果の保存

生成されたコンポーネントを以下に保存：

```bash
# コンポーネントファイル
src/components/{category}/{ComponentName}.tsx

# 保存前にディレクトリ確認
ls src/components/{category}/
```

### Step 7: 次のステップ案内

```markdown
## 生成完了

**V0 Chat ID**: {chat_id}
**V0 Link**: https://v0.dev/chat/{chat_id}

### 次のステップ
1. `/v0-validate` でバリアント・a11y検証を実行
2. Vercel Preview でUI確認
3. `/design-approve` でデザイン承認

### 生成ファイル
- `src/components/{category}/{ComponentName}.tsx`
```

## 観点チェックリスト

生成前に確認：

- [ ] コンポーネント名がPascalCaseである
- [ ] 用途が明確に定義されている
- [ ] 全4バリアントを要求している
- [ ] data-testid命名規則を指定している

## トラブルシューティング

### V0が応答しない場合
1. MCP接続を確認: `ListMcpResourcesTool`
2. v0サーバーが有効か確認
3. 手動でv0.devを使用してリンクを共有

### バリアントが不足している場合
1. `mcp__v0__sendChatMessage` で追加リクエスト
2. 不足バリアントを明示的に要求
