---
name: investigate
description: Issue作成・実装前の事前調査を行い調査レポートを生成。コードベース理解、影響範囲特定、技術リスク洗い出しに使用
context: fork
arguments:
  - name: target
    description: 調査対象（機能名、問題、アイデア）
    required: true
  - name: purpose
    description: 調査目的（issue/implementation/analysis）
    required: false
    default: "issue"
allowed-tools:
  - Read
  - Grep
  - Glob
  - LS
  - Bash(git log:*)
  - Bash(git diff:*)
  - Bash(ls:*)
  - Bash(cat:*)
  - Bash(mkdir:*)
  - Bash(python3:*)
  - mcp__o3__o3-search
  - mcp__o3-search__o3-search
  - WebSearch
  - WebFetch
  - Task
  - Write
hooks:
  Stop:
    - hooks:
        - type: command
          command: |
            # 調査連携データの保存状態をチェック
            LATEST=~/.claude/cache/investigations/latest.json
            if [ -f "$LATEST" ]; then
              MOD_TIME=$(stat -f %m "$LATEST" 2>/dev/null || stat -c %Y "$LATEST" 2>/dev/null)
              NOW=$(date +%s)
              DIFF=$((NOW - MOD_TIME))
              if [ $DIFF -lt 300 ]; then
                echo "✅ 調査連携データが保存されました（/issue で自動読み込み可能）"
              else
                echo "⚠️ 調査連携データが古いです。Step 6 で save-report.py を実行してください"
              fi
            else
              echo "⚠️ 調査連携データがありません。Step 6 で save-report.py を実行してください"
            fi
          timeout: 3000
---

# /investigate - 調査スキル

Issue作成・実装前の事前調査を行い、調査レポートを生成します。

## 目的

- 実装前に既存コードベースを理解する
- 影響範囲を特定する
- 技術的な制約・リスクを洗い出す
- 適切なアプローチを選定する

## 実行フロー

### Step 1: 調査対象の確認

ユーザーに以下を確認：

1. **調査対象**: 何を調査するか（機能名、問題、アイデア）
2. **調査目的**: なぜ調査するか（Issue作成のため、実装方針決定のため等）

### Step 2: コードベース調査

#### 2.1 関連ファイル探索
```bash
# パターンで検索
Glob: src/**/*{keyword}*.{ts,tsx}

# コード内検索
Grep: {keyword}
```

#### 2.2 既存実装の理解
- 関連コンポーネント・関数を読む
- データフロー（props, state, API）を追跡
- 依存関係を確認

#### 2.3 技術スタック確認
- 使用ライブラリ・フレームワーク
- 既存パターン（コーディング規約）
- テスト方針

#### 2.4 高度な技術調査（o3-search統合）

複雑な技術課題の場合、o3-searchを活用：

```
mcp__o3-search__o3-search({
  input: "React Server Components best practices 2025"
})
```

**活用シーン:**
- 最新フレームワークのベストプラクティス調査
- パフォーマンス最適化手法の調査
- セキュリティ対策の調査

#### 2.5 デザインシステム調査（UI機能の場合）

UI/UX変更を伴う機能の場合、以下を必ず調査：

```bash
# registry.json 存在確認
ls registry.json src/registry.json .design-system/registry.json 2>/dev/null

# Storybook 確認
ls -la .storybook/ 2>/dev/null

# 既存UIコンポーネント一覧
ls -la src/components/ui/

# デザイントークン確認
ls -la src/styles/tokens/ 2>/dev/null
```

**確認項目:**
- [ ] `registry.json` が存在するか
- [ ] Storybook が設定されているか
- [ ] 再利用可能なコンポーネントがあるか
- [ ] デザイントークン（色、タイポグラフィ）が定義されているか

**デザインシステムがない場合:**
→ UI開発前に[デザインシステム構築ガイド](https://github.com/PROLE-ISLAND/.github/wiki/デザインシステム構築ガイド)に従って構築を推奨

### Step 3: 影響範囲分析

| 観点 | チェック項目 |
|------|-------------|
| **Frontend** | 変更が必要なコンポーネント、ページ |
| **Backend** | 変更が必要なAPI、サーバーアクション |
| **Database** | スキーマ変更、マイグレーション |
| **テスト** | 影響を受けるテスト、追加が必要なテスト |

### Step 4: リスク・制約の洗い出し

- 技術的負債
- 破壊的変更の可能性
- パフォーマンス影響
- セキュリティ考慮事項

### Step 5: 調査レポート生成

以下の形式でレポートを作成し、`docs/investigations/` に保存：

```markdown
# 調査レポート: {タイトル}

**調査日**: {date}
**調査者**: Claude Code
**目的**: {purpose}

## サマリー

{3-5行で調査結果の要約}

## 調査対象

{調査した機能・問題の説明}

## 現状分析

### 関連ファイル

| ファイル | 役割 | 変更要否 |
|---------|------|---------|
| `path/to/file.ts` | {role} | {yes/no/maybe} |

### データフロー

```
{データの流れを図示}
```

### 依存関係

- {dependency1}
- {dependency2}

## 影響範囲

### Frontend
- {component1}
- {component2}

### Backend
- {api1}

### Database
- {table1}

### デザインシステム（UI機能の場合）

| 項目 | 状態 | 詳細 |
|------|------|------|
| registry.json | ✓ / ❌ | {path or "未設定"} |
| Storybook | ✓ / ❌ | {status} |
| 再利用可能コンポーネント | {count}件 | {list} |
| デザイントークン | ✓ / ❌ | colors, typography, spacing |

**既存コンポーネント（再利用推奨）:**
- {component1}
- {component2}

**新規作成が必要なコンポーネント:**
- {new-component1}

## 技術的考慮事項

### リスク
- {risk1}
- {risk2}

### 制約
- {constraint1}

## 推奨アプローチ

### 案1: {approach1}
- **概要**:
- **メリット**:
- **デメリット**:

### 案2: {approach2}
- **概要**:
- **メリット**:
- **デメリット**:

## 結論・推奨

{推奨するアプローチと理由}

## 次のステップ

1. [ ] Issue作成
2. [ ] 要件定義PR作成
3. [ ] 実装開始
```

### Step 6: レポート保存と連携データ生成

```bash
# ディレクトリ作成（なければ）
mkdir -p docs/investigations

# レポート保存
Write: docs/investigations/{date}-{slug}.md
```

**重要**: 調査完了後、必ず連携スクリプトを実行して /issue との自動連携を有効化：

```bash
python3 ~/.claude/skills/investigate/scripts/save-report.py --save \
  --title "調査タイトル" \
  --summary "サマリー（3-5行）" \
  --report-path "docs/investigations/xxx.md" \
  --recommended "案A" \
  --recommended-reason "推奨理由" \
  --affected "frontend,backend,database" \
  --risks "リスク1,リスク2" \
  --existing-system "システム名" \
  --approaches-json '[{"name":"案A名","summary":"概要","pros":"メリット","cons":"デメリット","effort":"小"},{"name":"案B名","summary":"概要","pros":"メリット","cons":"デメリット","effort":"中"}]'
```

これにより以下が自動実行される：
- `~/.claude/cache/investigations/investigation_YYYYMMDD_HHMMSS.json` 保存
- `~/.claude/cache/investigations/latest.json` シンボリックリンク更新
- `/issue` で自動読み込み可能に

## 出力

調査完了後、以下を報告：

1. **調査レポートのパス**: `docs/investigations/{filename}.md`
2. **サマリー**: 3-5行で要約
3. **推奨アプローチ**: 最も推奨する方針
4. **次のアクション**: `/issue` でIssue作成を促す

## 使用例

```
User: トップページの検査コード入力を廃止して、直接検査選択画面にしたい
Assistant: 調査を開始します...

[調査実施]

調査完了しました。

📄 レポート: docs/investigations/2025-01-07-landing-page-redesign.md

📝 サマリー:
- 現在のトップページは検査コード入力が必須
- AssessmentSelectorコンポーネントは既に作成済み
- 候補者作成APIの新規追加が必要

🎯 推奨アプローチ:
トップページにCandidateInfoForm + AssessmentSelectorを統合

👉 次のステップ: /issue で Issue作成
```
