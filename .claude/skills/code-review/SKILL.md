---
name: code-review
description: Claude + 静的解析による自動コードレビュー。外部API不要。品質チェック・セキュリティ検証・改善提案を実行
context: fork
arguments:
  - name: target
    description: レビュー対象（ファイルパス/PR番号/diff/ディレクトリ）
    required: true
  - name: policy
    description: レビューポリシー（standard/strict/security）
    required: false
    default: "standard"
  - name: fix
    description: 自動修正実行（true/false）
    required: false
    default: "false"
  - name: dod
    description: DoD Level（bronze/silver/gold）
    required: false
    default: "silver"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash(npm run lint:*)
  - Bash(npx eslint:*)
  - Bash(npx tsc:*)
  - Bash(npm run typecheck:*)
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(gh pr view:*)
  - Bash(grep:*)
  - TodoWrite
---

# /code-review - 自動コードレビュー（API不要版）

Claude + 静的解析ツールで、品質チェック・セキュリティ検証・改善提案を実行。
**外部API呼び出しなし** - Claude自身の分析能力と既存ツールで完結。

## 実行フロー

### Step 1: 対象ファイル特定

```bash
# PR番号指定の場合
gh pr view {PR番号} --json files -q '.files[].path'
gh pr diff {PR番号}

# 変更ファイル一覧（ローカル）
git diff --name-only HEAD~1

# 特定ディレクトリ
Glob: src/**/*.{ts,tsx}
```

### Step 2: 静的解析実行

```bash
# TypeScript型チェック
npx tsc --noEmit 2>&1

# ESLint
npx eslint {target} --format stylish 2>&1

# 複合チェック（package.jsonにスクリプトがある場合）
npm run lint 2>&1
npm run typecheck 2>&1
```

### Step 3: セキュリティチェック

以下のパターンをGrepで検索:

```bash
# ハードコードされた認証情報
grep -rn "password\s*=" --include="*.ts" --include="*.tsx" {target}
grep -rn "api[_-]?key\s*=" --include="*.ts" --include="*.tsx" {target}
grep -rn "secret\s*=" --include="*.ts" --include="*.tsx" {target}

# eval使用（危険）
grep -rn "eval(" --include="*.ts" --include="*.tsx" {target}

# dangerouslySetInnerHTML（XSSリスク）
grep -rn "dangerouslySetInnerHTML" --include="*.tsx" {target}

# SQLインジェクションリスク
grep -rn "query\s*(" --include="*.ts" {target} | grep -v "prisma"
```

### Step 4: Claude分析（コードを読んでレビュー）

対象ファイルを読み込み、以下の観点でレビュー:

#### 品質観点
- [ ] 関数・変数の命名は明確か
- [ ] 単一責任の原則を守っているか
- [ ] 複雑度は適切か（ネストが深すぎないか）
- [ ] 重複コードはないか
- [ ] コメントは適切か（過不足なく）

#### TypeScript観点
- [ ] `any` 型を使用していないか
- [ ] 型定義は適切か
- [ ] nullチェックは行われているか
- [ ] ジェネリクスが適切に使われているか

#### React観点（.tsx）
- [ ] useEffect の依存配列は正しいか
- [ ] useMemo/useCallback は適切に使われているか
- [ ] key propは一意か
- [ ] 不要な再レンダリングはないか

#### セキュリティ観点
- [ ] ユーザー入力のサニタイズ
- [ ] 認証・認可チェック
- [ ] シークレットの露出なし
- [ ] XSS対策

#### テスト観点
- [ ] 対応するテストファイルが存在するか
- [ ] エッジケースがカバーされているか
- [ ] モックが適切に使われているか

### Step 5: レポート生成

```markdown
## 🔍 コードレビューレポート

### サマリー
- **対象**: {target}
- **ポリシー**: {policy}
- **DoD Level**: {dod}
- **総合評価**: ✅ PASS / ⚠️ WARNING / ❌ FAIL

### 静的解析結果

| ツール | 結果 | 詳細 |
|-------|------|------|
| TypeScript | ✅ / ❌ | {errors} |
| ESLint | ✅ / ❌ | {warnings/errors} |
| Security Scan | ✅ / ❌ | {findings} |

### コードレビュー結果

| ファイル | 評価 | 主な指摘 |
|---------|------|---------|
| {file1} | ⭐⭐⭐⭐ | {comment} |
| {file2} | ⭐⭐⭐ | {comment} |

### 問題点

#### 🔴 Critical（修正必須）
- {issue1}
  - 場所: `{file}:{line}`
  - 修正案: {suggestion}

#### 🟡 Warning（推奨）
- {issue2}
  - 場所: `{file}:{line}`
  - 修正案: {suggestion}

#### 🟢 Info（参考）
- {issue3}

### セキュリティ

| チェック項目 | 結果 | 備考 |
|-------------|------|------|
| ハードコード認証情報 | ✅ / ❌ | {detail} |
| XSSリスク | ✅ / ❌ | {detail} |
| eval使用 | ✅ / ❌ | {detail} |

### 改善提案

1. **{suggestion1}**
   ```typescript
   // Before
   {before_code}

   // After
   {after_code}
   ```

### 追加すべきテスト

- [ ] {test1}
- [ ] {test2}

### 結論

{summary}
```

## ポリシー別チェック項目

### standard（デフォルト）
- 型エラーなし
- ESLintエラーなし
- 基本的なセキュリティチェック

### strict
- standard +
- ESLint警告もなし
- 複雑度チェック
- 命名規則チェック
- any禁止

### security
- standard +
- 全セキュリティパターン検索
- 依存関係の脆弱性チェック
- 認証・認可フローレビュー

## DoD Level別要件

| Level | 要件 |
|-------|------|
| bronze | 型エラー・ESLintエラーなし |
| silver | bronze + テストファイル存在・セキュリティOK |
| gold | silver + E2E・パフォーマンス・a11y |

## 使用例

```
# ファイル指定
/code-review target=src/components/UserList.tsx

# PR指定
/code-review target=#123

# ディレクトリ指定（strictポリシー）
/code-review target=src/lib policy=strict

# セキュリティ重視
/code-review target=src/app/api policy=security dod=gold

# 自動修正付き
/code-review target=src/components fix=true
```