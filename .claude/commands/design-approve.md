# /design-approve - デザイン承認管理ウィザード

このコマンドは、V0コンポーネントのデザイン承認を管理するためのウィザードです。

## 実行フロー

### Step 1: 承認対象の確認

ユーザーに以下を確認してください：

| 項目 | 説明 |
|------|------|
| **対象PR** | 要件定義PR番号（#xxx） |
| **コンポーネント** | 承認対象のコンポーネント名 |
| **V0 Link** | https://v0.dev/chat/xxx |
| **Preview URL** | Vercel Preview URL |

### Step 2: 現在の状態確認

対象PRの状態を確認：

```bash
# PR情報取得
gh pr view {pr_number} --json labels,state,title

# 現在のラベル確認
gh pr view {pr_number} --json labels -q '.labels[].name'
```

### Step 3: 検証完了チェック

以下が完了しているか確認：

```markdown
## デザイン承認前チェックリスト

### V0生成 (/v0-generate)
- [ ] V0でコンポーネント生成済み
- [ ] V0 Link記録済み

### バリデーション (/v0-validate)
- [ ] 全4バリアント存在確認済み
- [ ] data-testid付与確認済み
- [ ] デザインシステム準拠確認済み
- [ ] a11y基本チェック済み

### Vercel Preview確認
- [ ] Preview URLでUI表示確認
- [ ] 全バリアントの動作確認
- [ ] レスポンシブ表示確認
- [ ] ダークモード表示確認

### Vercel Toolbar確認
- [ ] a11y監査パス
- [ ] パフォーマンス問題なし
```

### Step 4: 承認判定

チェックリストの結果に基づいて判定：

**全項目OK の場合:**
```markdown
## 承認判定: ✅ APPROVED

すべての検証項目をパスしました。
`design-approved` ラベルを付与します。
```

**NG項目がある場合:**
```markdown
## 承認判定: ❌ REJECTED

以下の項目が未完了です：
- {未完了項目1}
- {未完了項目2}

対応後、再度 `/design-approve` を実行してください。
```

### Step 5: ラベル操作

**承認する場合:**

```bash
# design-review ラベルを削除（存在する場合）
gh pr edit {pr_number} --remove-label "design-review"

# design-approved ラベルを付与
gh pr edit {pr_number} --add-label "design-approved"

# PRにコメント追加
gh pr comment {pr_number} --body "## ✅ デザイン承認完了

### 承認内容
- **コンポーネント**: {ComponentName}
- **V0 Link**: {v0_link}
- **Preview URL**: {preview_url}

### 検証結果
- バリアント: ✅ 全4種類確認
- a11y: ✅ 監査パス
- デザインシステム: ✅ 準拠

### 次のステップ
\`/dev\` で実装PRを作成可能です。

---
🤖 /design-approve により承認"
```

**却下する場合:**

```bash
# design-review ラベルを維持または付与
gh pr edit {pr_number} --add-label "design-review"

# PRにコメント追加
gh pr comment {pr_number} --body "## ❌ デザイン承認保留

### 未完了項目
{未完了項目リスト}

### 対応依頼
上記項目を対応後、再度 \`/design-approve\` を実行してください。

---
🤖 /design-approve により保留"
```

### Step 6: 関連Issueの更新（任意）

関連Issueがある場合、ステータスを更新：

```bash
# Issueにコメント追加
gh issue comment {issue_number} --body "## デザイン承認完了

要件定義PR #{pr_number} のデザインが承認されました。
実装PR作成可能です。"

# ready-to-develop ラベル付与（まだない場合）
gh issue edit {issue_number} --add-label "ready-to-develop"
```

### Step 7: 完了レポート

```markdown
## デザイン承認完了レポート

**対象PR**: #{pr_number}
**コンポーネント**: {ComponentName}
**承認日時**: {datetime}

### ラベル変更
- 削除: `design-review`
- 追加: `design-approved`

### 関連リンク
- V0 Link: {v0_link}
- Preview URL: {preview_url}
- PR: {pr_url}

### 次のステップ
```bash
/dev #{issue_number}  # 実装PR作成
```
```

## 観点チェックリスト

承認前に確認：

- [ ] 対象PRが存在する
- [ ] V0コンポーネントが生成済み
- [ ] /v0-validate で検証済み
- [ ] Preview URLで確認済み

## コマンドオプション

```bash
/design-approve                    # 対話的に承認
/design-approve #123               # PR番号指定
/design-approve --check-only       # ラベル操作なし、チェックのみ
/design-approve --force            # チェックスキップ（非推奨）
```

## ラベルワークフロー

```
/req PR作成
    ↓
[design-review] 自動付与（UI変更検出時）
    ↓
/v0-generate → /v0-validate
    ↓
/design-approve
    ↓
[design-approved] 付与 & [design-review] 削除
    ↓
/dev PR作成可能
```

## トラブルシューティング

### ラベル付与に失敗する場合
1. GitHub CLIの認証を確認: `gh auth status`
2. リポジトリへの書き込み権限を確認
3. ラベルがリポジトリに存在するか確認

### PRが見つからない場合
1. PR番号が正しいか確認
2. PRがクローズされていないか確認
3. リポジトリが正しいか確認: `gh repo view`
