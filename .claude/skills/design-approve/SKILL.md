---
name: design-approve
description: /design-approve - デザイン承認管理ウィザード
context: fork
arguments:
  - name: pr_number
    description: 対象の要件定義PR番号
    required: true
  - name: check_only
    description: ラベル操作せずチェックのみ実行
    required: false
    default: "false"
allowed-tools:
  - Read
  - Bash(gh pr:*)
  - Bash(gh issue:*)
  - AskUserQuestion
hooks:
  PreToolUse:
    - matcher: "Bash(gh pr edit:*)"
      hooks:
        - type: command
          command: "echo 'Design approval label change'"
          timeout: 1000
---

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

### Step 6: 完了レポート

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
