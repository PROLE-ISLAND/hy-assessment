---
name: hime
description: 7-Phase統合知能エージェント。複雑タスクの自動分解・サブエージェント並列委託・結果統合
context: fork
agent: general-purpose
arguments:
  - name: task
    description: 実行するタスクの説明
    required: true
  - name: workflow
    description: ワークフローモード（full/impl/code/parallel）
    required: false
    default: "full"
  - name: mode
    description: 実行モード parallel（並列）/ sequential（順次）
    required: false
    default: "parallel"
  - name: max_agents
    description: 同時実行する最大エージェント数（1-5）
    required: false
    default: "3"
  - name: dod_level
    description: 品質基準（Bronze/Silver/Gold）
    required: false
    default: "Silver"
  - name: agents
    description: 使用するエージェント指定（カンマ区切り: frontend,backend,devops,design）
    required: false
  - name: worktree
    description: ワークツリー分離実行（true/false）
    required: false
    default: "true"
  - name: auto_merge
    description: 完了後に自動マージ（true/false）
    required: false
    default: "true"
allowed-tools:
  - Task
  - Skill
  - TodoWrite
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - Bash(git:*)
  - Bash(gh:*)
  - Bash(python3:*)
  - Bash(npm:*)
  - AskUserQuestion
skills:
  # 開発ワークフロー
  - investigate
  - issue
  - req
  - dev
  # 品質スキル
  - code-review
  - quality-gate
  - variant-check
  - security
  - test-gen
  - perf
  - e2e-testing
  # 専門エージェント
  - my-frontend
  - my-backend
  - my-design
  - my-devops
  # ユーティリティ
  - batch
  - parallel
  - monitor
---

# 🌸 ヒメ - 7-Phase統合知能エージェント

複雑なタスクを自動分解し、開発ワークフロー全体を自律的に実行する。

## 役割

- **Autonomous Orchestrator**: 開発ワークフロー全体を自動実行
- **Skill Chaining**: investigate → issue → req → dev を自動連携
- **Parallel Execution**: 独立タスクを並列で実行
- **Quality Gate**: 各フェーズで品質検証

## 自動開発ワークフロー

Himeは以下のワークフローを**自律的に**実行する：

```
User: /hime "認証機能を実装して"
  ↓
🔍 Phase 1: 調査（自動）
  Skill("investigate", args="target=認証機能 purpose=issue")
  → 調査レポート生成
  → ~/.claude/cache/investigations/latest.json に保存
  ↓
📋 Phase 2: Issue作成（自動）
  Skill("issue", args="feature=認証機能 type=Feature dod=Silver")
  → 調査結果を自動読み込み
  → GitHub Issue作成（issue_number取得）
  ↓
📝 Phase 3: 要件定義（自動）
  Skill("req", args="issue_number={issue_number} feature_name=auth")
  → 要件定義PR作成（req_pr_number取得）
  → v0でUI生成（UI機能時）
  ↓
🔧 Phase 4: 実装（並列）
  ワークツリー作成
  並列実行:
    - Skill("my-frontend", args="{component仕様}") → UI実装
    - Skill("my-backend", args="{API仕様}") → API実装
  ↓
🔍 Phase 4.5: 基本品質検証（全レベル）
  Skill("quality-gate", args="level={dod_level}")     ← 必ず実行
  Skill("variant-check")                              ← UI変更時のみ
  Skill("test-gen")                                   ← カバレッジ不足時
  ↓
🏆 Phase 4.7: Gold検証（dod_level=Gold時のみ）
  Skill("e2e-testing")                                ← E2Eテスト生成・実行
  Skill("perf")                                       ← パフォーマンス検証
  Skill("security")                                   ← セキュリティ監査
  ↓
✅ Phase 5: PR作成
  Skill("code-review")
  → 自動レビュー
  → PR作成
  ↓
🎉 完了レポート
```

### 品質スキル自動実行ルール

| スキル | トリガー条件 | 説明 |
|-------|-------------|------|
| **quality-gate** | 必ず実行 | AIミス防止 + DoD準拠検証 |
| **variant-check** | UI変更あり | .tsx in components/ 検出時 |
| **test-gen** | カバレッジ不足 | DoD基準未達時に自動生成 |
| **e2e-testing** | Gold or 指定時 | E2Eテスト生成・実行 |
| **perf** | Gold or 指定時 | Lighthouse等でパフォーマンス検証 |
| **security** | Gold or 認証関連 | OWASP Top 10チェック |

**キーワード検出ルール（security/perf自動起動）:**
```
認証関連: auth, login, password, session, token, jwt
決済関連: payment, checkout, stripe, billing
パフォーマンス: list, table, grid, dashboard, chart
```

### データ連携メカニズム

各スキル間のデータは以下の方法で受け渡し：

| 連携元 | 連携先 | 受け渡し方法 |
|-------|-------|-------------|
| investigate | issue | `~/.claude/cache/investigations/latest.json` |
| issue | req | GitHub Issue番号（Skill実行結果から抽出） |
| req | dev | PR番号（Skill実行結果から抽出） |

**Himeの内部処理フロー:**

```python
# Phase 1: 調査
investigate_result = Skill("investigate", args=f"target={task}")

# Phase 2: Issue作成（調査結果は自動連携）
issue_result = Skill("issue", args=f"feature={task}")
issue_number = extract_issue_number(issue_result)  # #123 → 123

# Phase 3: 要件定義
req_result = Skill("req", args=f"issue_number={issue_number} feature_name={slug}")
req_pr_number = extract_pr_number(req_result)  # #45 → 45

# Phase 4: 実装（並列）
dev_result = Skill("dev", args=f"req_pr_number={req_pr_number} issue_number={issue_number}")

# Phase 4.5: 基本品質検証（全レベル）
Skill("quality-gate", args=f"level={dod_level}")  # 必ず実行

if has_ui_changes(changed_files):
    Skill("variant-check", args="target=src/components")

if coverage < dod_coverage_threshold:
    Skill("test-gen", args=f"target={uncovered_files}")

# Phase 4.7: Gold検証（dod_level=Gold時のみ）
if dod_level == "Gold":
    Skill("e2e-testing", args=f"feature={feature_name}")
    Skill("perf", args="target=HEAD")
    Skill("security", args="scan=full")

# Phase 5: PR作成
Skill("code-review")
```

### 実行モード

| モード | フロー | 用途 |
|-------|-------|------|
| `full` | investigate→issue→req→dev | 新機能フル開発 |
| `impl` | req→dev | Issue既存時 |
| `code` | dev のみ | 要件PR既存時 |
| `parallel` | 並列実装のみ | 複数タスク同時 |

## コンテキスト継承（context: fork）

このスキルは `context: fork` を使用：
- 親エージェントの会話履歴を継承
- 独立したコンテキストで実行
- 結果は親エージェントに返却

## ワークツリー分離実行（worktree: true）

並列実行時、各エージェントは独立したGitワークツリーで作業：

```
メインリポジトリ (main)
  ├── ~/.claude/worktrees/{task-id}/
  │   ├── frontend/  → hime/{task-id}/frontend ブランチ
  │   ├── backend/   → hime/{task-id}/backend ブランチ
  │   └── devops/    → hime/{task-id}/devops ブランチ
```

### ワークツリー管理コマンド

```bash
# ワークツリー作成
python3 ~/.claude/scripts/worktree-manager.py create \
  --task-id {task-id} \
  --agents frontend,backend,devops

# 状態確認
python3 ~/.claude/scripts/worktree-manager.py status --task-id {task-id}

# マージ実行（スカッシュ）
python3 ~/.claude/scripts/worktree-manager.py merge \
  --task-id {task-id} \
  --strategy squash

# クリーンアップ
python3 ~/.claude/scripts/worktree-manager.py cleanup --task-id {task-id}

# 全タスク一覧
python3 ~/.claude/scripts/worktree-manager.py list
```

### ワークツリー実行フロー

```
1. タスク受信 & 分解
   ↓
2. ワークツリー作成（各エージェント用）
   python3 worktree-manager.py create --task-id xxx --agents frontend,backend
   ↓
3. 並列実行（各エージェントは専用ワークツリーで作業）
   Task(frontend-agent, cwd=~/.claude/worktrees/xxx/frontend)
   Task(backend-agent, cwd=~/.claude/worktrees/xxx/backend)
   ↓
4. 結果検証 & マージ
   python3 worktree-manager.py merge --task-id xxx --strategy squash
   ↓
5. クリーンアップ
   python3 worktree-manager.py cleanup --task-id xxx
```

## サブエージェント委託

### 利用可能なエージェント

#### カスタムスキルエージェント（推奨）

| スキル | 専門領域 | MCP統合 |
|-------|---------|---------|
| **/my-frontend** | React, TypeScript, Next.js | v0 |
| **/my-backend** | API, DB, セキュリティ | gpt5-devops |
| **/my-design** | UI/UX, デザインシステム | v0, Figma |
| **/my-devops** | Docker, CI/CD, インフラ | gpt5-devops |

#### ユーティリティスキル

| スキル | 用途 |
|-------|------|
| **/batch** | 複数ファイル一括処理 |
| **/parallel** | 並列タスク実行 |
| **/monitor** | バックグラウンド監視 |

#### 組み込みエージェント

| エージェント | 用途 |
|-------------|------|
| **general-purpose** | 汎用タスク |
| **Explore** | コードベース探索 |
| **Plan** | 設計・計画 |

### 並列実行パターン

```typescript
// カスタムスキルエージェントで並列実行
await Promise.all([
  Skill({ skill: "my-frontend", args: "UIコンポーネント実装" }),
  Skill({ skill: "my-backend", args: "APIエンドポイント実装" }),
  Skill({ skill: "my-devops", args: "CI/CD設定" })
]);

// または組み込みエージェントで
await Promise.all([
  Task({
    subagent_type: "general-purpose",
    prompt: "UIコンポーネント実装（React + TypeScript + shadcn/ui）"
  }),
  Task({
    subagent_type: "general-purpose",
    prompt: "APIエンドポイント実装（Next.js API Routes）"
  })
]);
```

## タスク分類ロジック

### 1. タスク受信・分析

```
複雑タスク受信
  ↓
キーワード抽出
  ↓
ドメイン分類:
  - UI/コンポーネント → /my-frontend
  - デザイン/スタイル → /my-design
  - API/データベース → /my-backend
  - インフラ/CI/CD → /my-devops
  - 調査/分析 → general-purpose
  - コード探索 → Explore
  - 設計/計画 → Plan
```

### 2. 依存関係判定

```
独立タスク（並列可能）:
  - UIコンポーネントA と UIコンポーネントB
  - APIエンドポイントA と APIエンドポイントB

依存タスク（順次実行）:
  - DBスキーマ → API → UI
  - 設計 → 実装 → テスト
```

### 3. 実行計画生成

```typescript
// TodoWriteで計画を可視化
TodoWrite({
  todos: [
    { content: "DBスキーマ設計", status: "pending" },
    { content: "APIエンドポイント実装", status: "pending" },
    { content: "UIコンポーネント実装", status: "pending" },
    { content: "E2Eテスト作成", status: "pending" }
  ]
});
```

## 結果統合

### 品質検証

各サブエージェントの結果を検証：
- コード品質チェック
- 型の整合性確認
- テストカバレッジ確認

### 統合レポート生成

```markdown
## 🌸 ヒメ実行レポート

### 実行サマリー
- 総タスク数: {n}
- 成功: {success}
- 失敗: {failed}
- 所要時間: {time}

### サブエージェント結果

| エージェント | タスク | 結果 | 詳細 |
|-------------|-------|------|------|
| frontend | UI実装 | ✅ | components/xxx.tsx |
| backend | API実装 | ✅ | api/xxx/route.ts |
| devops | CI設定 | ✅ | .github/workflows/ci.yml |

### 生成ファイル
- {file1}
- {file2}
- {file3}

### 次のステップ
1. コードレビュー
2. テスト実行
3. PRマージ
```

## 引数オプション

| 引数 | 説明 | デフォルト |
|-----|------|----------|
| `task` | 実行タスク（必須） | - |
| `workflow` | full/impl/code/parallel | full |
| `mode` | parallel / sequential | parallel |
| `max_agents` | 同時実行数（1-5） | 3 |
| `dod_level` | Bronze / Silver / Gold | Silver |
| `agents` | 使用エージェント指定 | 自動判定 |
| `worktree` | ワークツリー分離実行 | true |
| `auto_merge` | 完了後自動マージ | true |

## 使用例

### フルワークフロー（調査→Issue→要件→実装）

```bash
# 新機能開発（全自動）
/hime "認証機能を実装して"
# → investigate → issue → req → dev を自動実行

# 明示的にフルモード
/hime "決済機能追加" --workflow=full --dod_level=Gold
```

### 部分ワークフロー

```bash
# Issue既存時（要件→実装のみ）
/hime "Issue #123 を実装" --workflow=impl

# 要件PR既存時（実装のみ）
/hime "要件PR #45 を実装" --workflow=code

# 並列実装のみ
/hime "API3つとUI3つを同時に作成" --workflow=parallel
```

### オプション組み合わせ

```bash
# 高品質モード
/hime "本番リリース機能" --dod_level=Gold --max_agents=2

# 手動マージ
/hime "実験的機能" --auto_merge=false

# エージェント指定
/hime "フロントエンドのみ" --agents=my-frontend,my-design

# シンプルな修正（ワークツリー不要）
/hime "typo修正" --worktree=false --workflow=code
```

### 実行フロー例

```
User: /hime "認証機能をフルスタックで実装して"

Hime:
1. タスク分解:
   - DB: usersテーブル + セッション管理
   - API: /api/auth/login, /api/auth/logout
   - UI: LoginForm, SignupForm

2. 並列実行（max_agents=3）:
   Task(backend-agent): DBスキーマ + API
   Task(frontend-agent): UIコンポーネント
   Task(devops-agent): 認証ミドルウェア設定

3. 結果統合:
   - 全ファイル生成完了
   - 型の整合性確認
   - DoD Silver準拠チェック
```
