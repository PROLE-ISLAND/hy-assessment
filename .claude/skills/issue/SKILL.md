---
name: issue
description: 調査レポートに基づきGitHub Issueを作成。複雑度判定・Sub-Issue分割・ラベル自動付与対応
context: fork
arguments:
  - name: feature
    description: 機能名・Issue対象（省略時は調査結果から自動取得）
    required: false
  - name: type
    description: Issue種別（Feature/Bug/Task）
    required: false
    default: "Feature"
  - name: priority
    description: 優先度（P0/P1/P2/P3）
    required: false
    default: "P2"
  - name: dod
    description: DoD Level（Bronze/Silver/Gold）
    required: false
    default: "Silver"
allowed-tools:
  - Read
  - Bash(gh issue:*)
  - Bash(gh label:*)
  - Bash(cat:*)
  - Bash(mkdir:*)
  - Write
  - AskUserQuestion
hooks:
  PreToolUse:
    - matcher: "Bash(gh issue create:*)"
      hooks:
        - type: command
          command: "python3 /Users/RyuichiAida/.claude/hooks/gate.py"
          timeout: 5000
---

# /issue - Issue作成ウィザード v2.0

組織ルールに準拠した高品質Issueを作成するウィザード。

## 実行フロー

### Step 0: 調査結果の自動読み込み

/investigate で保存された連携データを確認:

```bash
# Issue用フォーマットで出力（推奨）
python3 ~/.claude/skills/investigate/scripts/save-report.py --format-issue

# JSON形式で確認
python3 ~/.claude/skills/investigate/scripts/save-report.py --load

# 過去の調査一覧
python3 ~/.claude/skills/investigate/scripts/save-report.py --list
```

**連携データがある場合**（`--format-issue` の出力をそのまま利用可能）:
- 📋 事前調査セクション → Issue本文に自動挿入
- 影響範囲 → チェックボックスに自動反映
- 🎯 ゴール候補（案A/B/C） → そのまま利用
- リスク → 考慮事項として記載
- 暫定推奨・成功指標 → そのまま利用

**連携データがない場合**: `/investigate` を先に実行するよう促す

### Step 1: 調査ファースト確認

まず、調査レポートの有無を確認：

1. **調査レポートがある場合**: リンクを取得
2. **調査レポートがない場合**: `/investigate` を先に実行するよう促す

### Step 2: 必須情報の収集

| 項目 | 選択肢 | 説明 |
|------|--------|------|
| **Issue種別** | Feature / Bug / Task | テンプレート選択 |
| **優先度** | P0 / P1 / P2 / P3 | P0=緊急, P3=低 |
| **DoD Level** | Bronze / Silver / Gold | 品質レベル |

### Step 3: 複雑度判定（3ドメイン以上か？）

影響範囲を先に確認：
- [ ] フロントエンド (frontend)
- [ ] バックエンド (backend)
- [ ] データベース (database)
- [ ] インフラ (infrastructure)

**3つ以上 → 親Issue + Sub-Issue形式（Step 3.5へ）**
**2つ以下 → 単体Issue形式**

### Step 3.5: 分割戦略の選択（3ドメイン以上の場合）

| 戦略 | 分割単位 | 適したケース |
|------|---------|-------------|
| **レイヤー別** | DB → API → UI | 技術的依存が強い |
| **機能別** | 機能A → 機能B → 機能C | 段階リリースしたい |

## テンプレート

### 単体Issue（2ドメイン以下）

```markdown
## 📋 事前調査

- **調査レポートリンク**: [{report_name}]({link})
- **既存システム名**: {system_name}

## 🔴 問題定義（なぜ必要か）

### 現状の課題
{現在どんな問題・不便が発生しているか具体的に記述}

### 影響を受ける人
{誰がこの問題で困っているか - 役割を明記}

### 問題の影響度
{この問題によって発生している損失・非効率を定量的に記述できれば記述}

## 🎯 ゴール候補（/req で1つ選択）

### 案A: {アプローチ名}
- **概要**: {1-2文で説明}
- **メリット**: {利点}
- **デメリット**: {欠点・トレードオフ}
- **想定工数**: 小/中/大

### 案B: {アプローチ名}
- **概要**: {1-2文で説明}
- **メリット**: {利点}
- **デメリット**: {欠点・トレードオフ}
- **想定工数**: 小/中/大

### 案C（任意）: {アプローチ名}
- **概要**: {1-2文で説明}
- **メリット**: {利点}
- **デメリット**: {欠点・トレードオフ}
- **想定工数**: 小/中/大

### 暫定推奨
{案X} - 理由: {選定理由}

### 成功指標（仮 - /req で詳細化）
- [ ] {高レベルな指標1}
- [ ] {高レベルな指標2}

## 📝 機能定義

### 優先度
{P0/P1/P2/P3}

### DoD Level
{Bronze/Silver/Gold}

### 機能概要
{解決策の概要 - 詳細設計は /req で行う}

### ユースケース定義（Role × Outcome × Channel）

| UC-ID | Role | Outcome | Channel |
|-------|------|---------|---------|
| UC-{DOMAIN}-{ROLE}-{ACTION}-{CHANNEL} | {role} | {outcome} | WEB/API/EMAIL |

### Gold E2E 候補か？
- [ ] 5つのレンズ評価済み

## 🎨 UI開発（該当する場合）

- **v0 Link**: {link or TBD}
- **バリアント**: Default / Loading / Empty / Error

## 📊 影響範囲

- [x/] フロントエンド
- [x/] バックエンド
- [x/] データベース
- [ ] インフラ

## ✅ 受け入れ条件

- [ ] {condition1}
- [ ] {condition2}
- [ ] {condition3}
```

## Issue作成コマンド

```bash
# 本文をファイルに保存してから作成
gh issue create --title "[{type_ja}]: {title}" \
  --body-file /tmp/claude-cmd-issue.md \
  --label "{labels}"
```

**タイトル形式**:
| Issue種別 | プレフィックス |
|----------|--------------|
| Feature | `[機能]:` |
| Bug | `[バグ]:` |
| Task | `[タスク]:` |

**重要**:
- 必ず `--body-file` を使用（`--body` は禁止）
- ファイルパスは `/tmp/claude-cmd-` で始める（Hook識別用）

## 品質チェックリスト

### 必須項目（全Issue）
- [ ] 調査レポートリンク
- [ ] **問題定義**（現状の課題・影響を受ける人・影響度）
- [ ] **目的**（ゴール・成功指標）
- [ ] 優先度 (P0-P3)
- [ ] DoD Level (Bronze/Silver/Gold)
- [ ] ユースケース定義（UC-ID形式）
- [ ] 受け入れ条件

### 問題定義の品質チェック
- [ ] 「〜が困っている」が具体的に書かれている
- [ ] 影響を受ける人の役割が明記されている
- [ ] 可能なら定量的な影響度が記載されている

### ゴール候補の品質チェック
- [ ] 2つ以上の選択肢が提示されている
- [ ] 各案のメリット・デメリットが明記されている
- [ ] 暫定推奨と選定理由が記載されている
- [ ] 成功指標（仮）が記載されている（詳細は/reqで）

### 3ドメイン以上
- [ ] 親Issue + Sub-Issue形式で作成
- [ ] Sub-Issue間の依存関係明記

## ラベル命名規則

| カテゴリ | ラベル |
|---------|--------|
| 優先度 | `P0: Critical`, `P1: High`, `P2: Medium`, `P3: Low` |
| DoD | `dod:bronze`, `dod:silver`, `dod:gold` |
| 種別 | `feature`, `bug`, `task`, `enhancement` |
| ドメイン | `frontend`, `backend`, `database`, `infrastructure` |
