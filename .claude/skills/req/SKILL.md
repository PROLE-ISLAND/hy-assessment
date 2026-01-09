---
name: req
description: 要件定義PRを作成。Phase 1-5統合、V0 UI自動生成、デザインレビュー連携対応
context: fork
arguments:
  - name: issue_number
    description: 対象Issue番号（例: 123）
    required: true
  - name: feature_name
    description: 機能名（ブランチ名に使用）
    required: true
  - name: generate_ui
    description: V0でUI自動生成するか（true/false）
    required: false
    default: "auto"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash(gh pr:*)
  - Bash(gh issue:*)
  - Bash(git:*)
  - Bash(mkdir:*)
  - mcp__v0__createChat
  - mcp__v0__sendChatMessage
  - mcp__v0__getChat
  - AskUserQuestion
hooks:
  PostToolUse:
    - matcher: "mcp__v0__createChat"
      hooks:
        - type: command
          command: "echo 'V0 component generated - add design-review label'"
---

# /req - 要件定義PR作成ウィザード

Phase 1-5 統合要件定義PRを作成するウィザード。

## 全体ワークフロー

```
/investigate → /issue → /req（このコマンド）
                           │
                           ├─ Phase 1-4: 調査・要件・品質・技術設計
                           │
                           ├─ Step 4.5: V0 UI 自動生成（UI機能の場合）
                           │      │
                           │      ├─ mcp__v0__createChat（自動実行）
                           │      ├─ 4バリアント検証（自動実行）
                           │      └─ design-review ラベル付与（自動実行）
                           │
                           ├─ Phase 5: テスト設計
                           │
                           └─ PR作成 → 人間がVercel Preview確認 → /dev
```

## 実行フロー

### Step 1: 調査ファースト確認

調査レポートの有無を確認：

1. **調査レポートがある場合**: リンクを教えてください
2. **調査レポートがない場合**: `/investigate` を先に実行

### Step 2: 関連Issue確認

1. **Issueがある場合**: Issue番号を教えてください（例: #123）
2. **Issueがない場合**: `/issue` を先に実行

### Step 3: ブランチ作成

```bash
git checkout -b requirements/issue-{番号}-{機能名}
```

### Step 4: Phase 1-5 記入

#### Phase 1: 調査レポート ⚠️ 必須

```markdown
## 1. 調査レポート

**調査レポートリンク**: [Investigation Report]({link})

### Investigation Report v1 要約

| 項目 | 内容 |
|------|------|
| 既存システム名 | {name} |
| エントリーポイント | UI: / API: / CLI: |
| 主要データモデル | {models} |
```

#### Phase 2: 要件定義・ユースケース ⚠️ 必須

```markdown
## 2. 要件定義・ユースケース

### 2.1 機能概要

| 項目 | 内容 |
|------|------|
| **なぜ必要か（Why）** | {why} |
| **誰が使うか（Who）** | {who} |
| **何を達成するか（What）** | {what} |

### 2.2 ユースケース定義（Role × Outcome）

| UC-ID | Role | Outcome | Channel |
|-------|------|---------|---------|
| {uc_id} | {role} | {outcome} | WEB/API/EMAIL |
```

#### Phase 3: 品質基準 ⚠️ 必須

```markdown
## 3. 品質基準

### 3.1 DoD Level 選択

- [ ] Bronze (80%カバレッジ)
- [x] Silver (85%カバレッジ) ← 推奨
- [ ] Gold (95%カバレッジ)

### 3.2 Pre-mortem（失敗シナリオ） ⚠️ 3つ以上必須

| # | 失敗シナリオ | 発生確率 | 対策 |
|---|-------------|---------|------|
| 1 | {scenario1} | 高/中/低 | {action1} |
```

#### Phase 4: 技術設計 ⚠️ 必須

DB設計、API設計、UI設計を記載。

### Step 4.5: Storybookストーリー設計（UI機能の場合）⚠️ 必須

**UI変更を含む機能の場合、Storybookストーリー設計を要件に含める:**

```markdown
### 4.5 Storybook設計

#### コンポーネント一覧

| コンポーネント | 配置先 | Stories |
|---------------|--------|---------|
| {ComponentName} | `src/components/{path}` | 4バリアント |

#### バリアント定義（DLEE）

| バリアント | 状態 | 表示内容 | テスト観点 |
|-----------|------|---------|-----------|
| **Default** | 正常データ表示 | {具体的な表示内容} | データ反映確認 |
| **Loading** | データ取得中 | スケルトンUI | スピナー表示 |
| **Empty** | データなし | 「{メッセージ}」+ 作成ボタン | 誘導表示 |
| **Error** | エラー発生 | 「{エラーメッセージ}」+ リトライ | 回復手段 |

#### Storybookストーリーテンプレート

\`\`\`tsx
// src/components/{ComponentName}/{ComponentName}.stories.tsx
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
\`\`\`
```

**品質チェック:**
- [ ] 全4バリアント（DLEE）が定義されている
- [ ] 各バリアントの表示内容が具体的
- [ ] data-testid が計画されている
- [ ] アクセシビリティ考慮（aria-label等）

#### Phase 5: テスト設計 ⚠️ 必須

GWT仕様、単体テスト設計、統合テスト設計を記載。

### Step 6: PR作成

```bash
gh pr create \
  --template requirements.md \
  --title "requirements: {機能名}の実装計画" \
  --body-file /tmp/claude-cmd-req.md \
  --label type:requirements \
  --label ci:skip
```

## 観点チェックリスト

- [ ] 調査レポートがリンクされている
- [ ] ユースケースがRole × Outcomeで定義されている
- [ ] DoD Levelが選択・理由記載されている
- [ ] Pre-mortemで3つ以上の失敗シナリオ
- [ ] 技術設計（DB/API/UI）が記載されている
- [ ] **Storybook設計が記載されている（UI機能）**
- [ ] **4バリアント（DLEE）が定義されている（UI機能）**
- [ ] テスト設計が記載されている
