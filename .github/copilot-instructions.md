# HY Assessment - 開発ルール

## 📚 必読ドキュメント

開発開始前に以下を確認すること：

| ドキュメント | 内容 | 必須度 |
|-------------|------|--------|
| [DoD_STANDARDS.md](https://github.com/PROLE-ISLAND/.github/blob/main/DoD_STANDARDS.md) | 品質基準（77観点） | ⚠️ 最優先 |
| [組織Wiki](https://github.com/PROLE-ISLAND/.github/wiki) | 開発標準・CI/CD・テスト戦略 | ⚠️ 必須 |
| [組織CLAUDE.md](https://github.com/PROLE-ISLAND/.github/blob/main/CLAUDE.md) | 組織共通開発ルール | ⚠️ 必須 |
| [プロジェクトWiki](https://github.com/PROLE-ISLAND/hy-assessment/wiki) | 実装計画・プロジェクト固有情報 | 📖 参照 |
| このファイル | プロジェクト固有ルール | 📖 参照 |

> **ルール優先順位**: DoD_STANDARDS.md > 組織Wiki > 組織CLAUDE.md > このファイル

---

## プロジェクト概要
入社前適性検査システム（SaaS対応マルチテナント設計）

## 言語・ローカライゼーション

### UI テキストは日本語で記述
- ボタン、ラベル、メッセージはすべて日本語
- shadcn/ui コンポーネント使用時もテキストは日本語に置き換え
- プレースホルダーも日本語（例: `placeholder="メールアドレス"`）

### コードは英語、コメントは日本語
- 変数名、関数名は英語
- コメントは日本語

### コミット・PRは日本語
- コミットメッセージは日本語（プレフィックスは英語: `feat:`, `fix:`, `docs:` 等）
- PRタイトル・本文は日本語で記述
- `.github/PULL_REQUEST_TEMPLATE.md` に従う
- ブランチ名: `{type}/issue-{番号}-{説明}` または `{type}/{説明}`
  - 自動承認対象: `chore/`, `deps/`, `docs/`, `ci/`, `fix/sync`

## 技術スタック
- Next.js 15+ (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Supabase (Auth + Database + RLS)
- SurveyJS (検査フォーム)
- Recharts (グラフ)
- OpenAI API (AI分析)

## ディレクトリ構成
```
src/
├── app/           # Next.js App Router
├── components/    # UIコンポーネント
│   ├── ui/        # shadcn/ui
│   ├── layout/    # レイアウト系
│   ├── analysis/  # 分析チャート
│   └── dashboard/ # ダッシュボード
├── lib/
│   ├── supabase/      # Supabaseクライアント
│   └── design-system/ # デザインシステム
└── types/         # 型定義
```

## データベース設計
- 全テーブルに `organization_id` (マルチテナント)
- 全テーブルに `deleted_at` (ソフトデリート)
- RLSで組織間データ分離

## コーディング規約
- コンポーネントは関数コンポーネント + TypeScript
- Server Components優先、必要な場合のみ 'use client'
- Supabaseクエリには明示的な型注釈を付ける

---

## デザインシステム

**詳細ドキュメント**: `src/lib/design-system/DESIGN_SYSTEM.md`

### 基本原則
1. **ハードコード色禁止** - `text-green-600` 等の直接指定は使わない
2. **デザインシステム必須** - 色は必ず `@/lib/design-system` からインポート
3. **ダークモード対応** - すべての色にlight/dark両方のクラスを含める

### よく使うインポート
```typescript
import {
  getScoreTextClass,      // スコアに応じたテキスト色
  stateColors,            // 状態色（success/warning/error/info）
  getSelectionClasses,    // 選択状態のスタイル
  candidateStatusConfig,  // 候補者ステータス色
  judgmentConfig,         // 判定バッジ色
  chartTheme,             // Recharts統一テーマ
} from '@/lib/design-system';
```

### 主要な閾値
| 項目 | 閾値 |
|------|------|
| スコア優秀 | ≥ 70% (emerald) |
| スコア警告 | ≥ 50% (amber) |
| スコア危険 | < 50% (rose) |

---

## AI分析設定

### 環境変数
| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `OPENAI_API_KEY` | OpenAI APIキー | - |
| `OPENAI_DEFAULT_MODEL` | デフォルトモデル | `gpt-4o` |

### 利用可能なモデル（2025-12時点）
- `gpt-5.2` (最新)
- `gpt-5.2-pro` (高精度)
- `gpt-5.1`
- `gpt-4o`
- `gpt-4o-mini` (軽量・高速)

### 関連ファイル
- `src/lib/analysis/ai-analyzer.ts` - AI分析処理
- `src/components/analysis/ReanalyzeDialog.tsx` - 再分析UI（モデル選択）

---

## CI/CD

### GitHub Actions ワークフロー

| ワークフロー | トリガー | 内容 |
|-------------|---------|------|
| `ci.yml` | PR / push to main,develop | lint, type-check, unit-test, build |
| `deploy-production.yml` | push to main | Vercel本番デプロイ |
| `quality-gate.yml` | CI完了後 | DoD判定・PRコメント投稿 |

### 必須チェック (PRマージ前)

```bash
npm run lint           # ESLint
npx tsc --noEmit       # TypeScript型チェック
npm run test:run       # Vitest単体テスト
npm run build          # Next.jsビルド
```

### DoD (Definition of Done)

すべての実装は [DoD基準](https://github.com/PROLE-ISLAND/.github/blob/main/DoD_STANDARDS.md) に従う。

| Level | 観点数 | 用途 | 必須タイミング |
|-------|--------|------|---------------|
| Bronze | 27 | PR最低基準 | PRオープン時 |
| Silver | 31 | マージ可能基準 | マージ前 |
| Gold | 19 | 本番リリース基準 | 本番デプロイ前 |

#### Gold E2Eテスト（ユースケーステスト）

Gold E2Eは「事業が死んでない証拠」。5〜10本に限定。

- 機能単位ではなく **Role × Outcome** でユースケースを定義
- 詳細は組織Wiki参照:
  - [Goldテストチャーター](https://github.com/PROLE-ISLAND/.github/wiki/Goldテストチャーター) - 目的・採用基準
  - [Gold仕様テンプレート](https://github.com/PROLE-ISLAND/.github/wiki/Gold仕様テンプレート) - GWT仕様テンプレート

**hy-assessment Gold候補（推奨5本）:**

| ユースケース | Role | Outcome |
|-------------|------|---------|
| 管理者ログイン | 管理者 | システムアクセス |
| 候補者登録→検査リンク発行 | 管理者 | 検査準備完了 |
| 検査回答→完了 | 候補者 | 回答データ保存 |
| AI分析結果取得 | 管理者 | 採用判断材料取得 |
| 結果レポート共有 | 管理者 | ステークホルダー共有 |

#### 実装計画時
- 対象DoD Level（Bronze/Silver/Gold）を明示
- 該当するDoD観点を洗い出し、計画に含める

#### 実装時
- Bronze観点（型安全、テスト、Lint）は常に遵守
- セキュリティ観点（入力検証、認可）は該当する場合必須

#### PR作成時
- DoD Levelを選択し、チェックリストを確認
- 未達項目がある場合は理由を記載

### 開発フロー

```
1. Issue作成 → DoD Level選択 → Label付与
2. 【UI機能】Figmaモックアップ作成 → デザインレビュー
3. ブランチ作成: feature/issue-{番号}-{説明}
4. Claude Code / Copilot で開発
5. PR作成 → CI自動実行 → Quality Gate判定
6. レビュー → 承認 → マージ → 自動デプロイ
```

---

## Figma-First ワークフロー

UI/UX変更を含む機能は、**Issue作成前にFigmaでデザインを作成**し、Issueにリンクを含めてから開発を開始する。

### フロー図

```
┌─────────────────────────────────────────────────────────────────┐
│                    Figma-First 開発フロー                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Figmaデザイン作成 ← 最初にこれ！                             │
│     └─ UIモックアップ・画面遷移を作成                            │
│     └─ チェックリスト確認（レスポンシブ、ダークモード等）         │
│           │                                                     │
│           ▼                                                     │
│  2. Issue作成（Figmaリンク込み）                                 │
│     └─ Feature Request テンプレート使用                         │
│     └─ Figmaリンクフィールドに URL を貼付                        │
│     └─ ラベル: `design-review` 自動付与                         │
│           │                                                     │
│           ▼                                                     │
│  3. デザインレビュー・承認                                       │
│     └─ レビュアーがFigmaを確認                                   │
│     └─ 承認後: `design-review` → `design-approved` に変更       │
│           │                                                     │
│           ▼                                                     │
│  4. 実装開始                                                     │
│     └─ `ready-to-develop` ラベル付与                            │
│     └─ Figmaデザインに沿って実装                                 │
│           │                                                     │
│           ▼                                                     │
│  5. PR作成 → CI → マージ                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**重要**: Figmaリンクのない UI機能 Issue は `design-review` で保留され、実装は開始されません。

### デザイン関連ラベル

| ラベル | 色 | 意味 |
|--------|-----|------|
| `design-review` | 紫 | デザインレビュー待ち |
| `design-approved` | 緑 | デザイン承認済み、実装可能 |
| `no-ui` | グレー | バックエンドのみ、UI変更なし |

### Figmaモックアップのチェックリスト

デザイン作成時に確認すること:

- [ ] モバイルレスポンシブ対応を考慮
- [ ] ダークモードの色を確認
- [ ] アクセシビリティ（コントラスト、フォントサイズ）
- [ ] 既存デザインシステムとの整合性

### バックエンドのみの機能

UI変更がない場合:
1. Issueテンプレートで「This is a backend-only feature」にチェック
2. `no-ui` ラベルを付与
3. Figmaリンクは不要
4. 直接 `ready-to-develop` へ

---

## v0 によるAIデザイン生成

[v0.dev](https://v0.dev) を使用して、UIコンポーネントをAIで生成し、開発を加速する。

### なぜv0か

| 項目 | v0の強み |
|------|----------|
| **技術スタック** | React + Tailwind + shadcn/ui（このプロジェクトと同一） |
| **出力形式** | そのまま使えるTSXコード |
| **品質** | WCAGアクセシビリティ対応がデフォルト |
| **料金** | 無料200クレジット/月、$20/月で無制限 |

### v0 + Figma 統合ワークフロー

```
┌─────────────────────────────────────────────────────────────────┐
│                    v0 + Figma 統合ワークフロー                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  【Step 1: v0でデザイン生成】                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  v0.dev でプロンプト入力                                  │   │
│  │  ・日本語OK、具体的に記述                                 │   │
│  │  ・「shadcn/ui使用」を明記                                │   │
│  │  ・ダークモード対応を指定                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│           │                                                     │
│           ▼                                                     │
│  【Step 2: Figmaに記録】                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  v0の出力をFigmaに保存                                    │   │
│  │  ・スクリーンショット貼り付け                             │   │
│  │  ・v0プロンプトをコメントで記録                           │   │
│  │  ・微調整があれば注釈追加                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│           │                                                     │
│           ▼                                                     │
│  【Step 3: Issue作成】                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GitHub Issue作成                                         │   │
│  │  ・Figmaリンク必須                                        │   │
│  │  ・v0リンク（生成結果のURL）も添付                        │   │
│  │  ・実装時はv0コードをベースに                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│           │                                                     │
│           ▼                                                     │
│  【Step 4: 実装】                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  v0コードを活用して実装                                   │   │
│  │  ・コピー → src/components/generated/ に配置             │   │
│  │  ・デザインシステムに合わせて微調整                       │   │
│  │  ・テスト追加                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### v0プロンプトテンプレート

```markdown
## 基本形式

「{コンポーネント名}を作成。
- shadcn/uiコンポーネント使用
- Tailwind CSS
- ダークモード対応（dark:クラス使用）
- 日本語テキスト
- {具体的な要件}」

## 例：空状態カード

「ダッシュボードの空状態カードを作成。
- shadcn/uiのCard, Buttonコンポーネント使用
- Tailwind CSS
- ダークモード対応
- 日本語テキスト「注目候補者がまだいません」
- イラストまたはアイコン付き
- 「候補者を追加」ボタン付き
- 中央寄せレイアウト」

## 例：データテーブル

「候補者一覧テーブルを作成。
- shadcn/uiのTable, Badge, Buttonコンポーネント使用
- 列: 名前、メール、ステータス（バッジ）、操作ボタン
- ソート可能なヘッダー
- 行ホバーエフェクト
- ダークモード対応
- 日本語ラベル」
```

### v0生成コンポーネントの配置

```
src/components/
├── ui/              # shadcn/ui（既存）
├── generated/       # v0生成ベースのコンポーネント
│   ├── README.md    # 生成元プロンプト・v0 URL記録
│   └── ...
├── analysis/
├── dashboard/
└── ...
```

### v0コード使用時の注意

1. **デザインシステム適用**: ハードコード色は `stateColors` に置換
2. **型安全性**: 必要に応じてPropsの型を追加
3. **テスト追加**: 単体テストを作成
4. **出典記録**: コンポーネント冒頭にv0 URLをコメントで記載

```typescript
/**
 * EmptyState component
 * Generated with v0: https://v0.dev/chat/xxxxx
 * Modified: デザインシステム適用、日本語化
 */
```

---

## Issue駆動開発（Claude Code向け）

### Issue作成（テンプレート準拠）

**重要**: Issue作成時は必ず専用スクリプトを使用し、テンプレートに準拠すること。

```bash
# バグ報告
npm run issue:bug

# 機能要望
npm run issue:feature
```

**必須項目（バグ報告）:**
- 優先度（P0-P3）
- DoD Level（Bronze/Silver/Gold）
- バグの説明
- 再現手順（ステップ形式）
- 影響するファイル
- テスト方法・検証手順
- 受け入れ条件

**必須項目（機能要望）:**
- 優先度（P1-P3）
- DoD Level（Bronze/Silver/Gold）
- 背景・なぜ必要か
- 機能の説明
- 要件（チェックリスト形式）
- テスト方法
- 受け入れ条件

### 開発開始時の必須手順

**Step 1: 対応可能なIssue確認**
```bash
gh issue list -l "ready-to-develop" --json number,title,labels -q '.[] | "\(.number): \(.title)"'
```

**Step 2: 優先度判断**
- P0 (Critical) → 最優先で即対応
- P1 (High) → 今週中に対応
- P2 (Medium) → スプリント内で対応
- P3 (Low) → バックログ

**Step 3: Issue詳細確認**
```bash
gh issue view {番号}
```

**Step 4: ブランチ作成**
```bash
git checkout -b feature/issue-{番号}-{簡潔な説明}
# 例: git checkout -b feature/issue-42-add-pdf-export
```

**Step 5: 実装計画をIssueコメントに追加** ⚠️必須
```bash
# Issueの詳細を確認後、実装計画をコメントとして投稿
gh issue comment {番号} --body "## 実装計画

### 変更ファイル
- \`path/to/file.ts\` - 変更内容

### 実装ステップ
1. xxx
2. xxx

### テスト方法
- [ ] 単体テスト追加
- [ ] E2Eテスト確認
"
```

**Step 6: 計画検証（任意）**
```bash
npm run plan:validate {番号}
```

**Step 7: 開発完了後のPR作成**
```bash
gh pr create --title "feat: {説明}" --body "closes #{番号}"
```

### ラベル体系

| ラベル | 意味 | Claude Codeの対応 |
|--------|------|------------------|
| `ready-to-develop` | 開発可能 | このラベルのIssueを優先的に取得 |
| `in-progress` | 作業中 | 他が作業中なのでスキップ |
| `blocked` | ブロック中 | 依存解決まで待機 |
| `needs-triage` | 要トリアージ | 人間の判断待ち |
| `design-review` | デザインレビュー待ち | Figma承認まで実装待機 |
| `design-approved` | デザイン承認済み | 実装開始OK |
| `no-ui` | UI変更なし | Figma不要、直接開発可能 |

### 自動チェック

- ブランチ名が `feature/issue-*` `bugfix/issue-*` `hotfix/issue-*` 形式でない場合、CIで警告
- PR本文に `closes #` がない場合、品質ゲートで警告

### 並行開発ガイドライン

> **詳細は [組織共通ルール](https://github.com/PROLE-ISLAND/.github/blob/main/copilot-instructions.md#並行開発ガイドライン) を参照。**

#### このリポジトリの `.gtrconfig` 設定

| 設定 | 値 |
|------|-----|
| AI tool | `claude` |
| Editor | `cursor` |
| postCreate | `npm install` |

---

### ブランチ命名規則

```
feature/issue-123-add-pdf-export
bugfix/issue-456-fix-login-error
hotfix/issue-789-critical-fix
```

### 必要なGitHub Secrets

| Secret名 | 用途 | 取得方法 |
|----------|------|----------|
| `VERCEL_TOKEN` | Vercel APIトークン | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel Organization ID | Vercel → Settings → General |
| `VERCEL_PROJECT_ID` | Vercel Project ID | Project → Settings → General |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | Supabase → Settings → API |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | E2E Preview用 | 下記参照 |
| `E2E_TEST_EMAIL` | E2Eテスト用メール | Supabaseで作成 |
| `E2E_TEST_PASSWORD` | E2Eテスト用パスワード | Supabaseで作成 |
| `CODECOV_TOKEN` | Codecovトークン（任意） | Codecov |

### Vercel環境変数（Preview環境）

Vercel Previewデプロイで必要な環境変数:

```bash
# Vercel CLIで設定
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
```

### Vercel Automation Bypass Secret の設定

E2E Preview workflowでVercel Deployment Protectionを回避するために必要:

1. **Vercelダッシュボード** → Project → Settings → Deployment Protection
2. **Protection Bypass for Automation** を有効化
3. 生成されたシークレットをコピー
4. **GitHub** → Repository → Settings → Secrets → New repository secret
5. `VERCEL_AUTOMATION_BYPASS_SECRET` として追加

参考: [Vercel Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)

---

## 実装計画の永続化（GitHub Wiki）

セッションを跨いで実装計画を共有するため、GitHub Wiki を使用する。

### Wiki URL

https://github.com/PROLE-ISLAND/hy-assessment/wiki

### 主要ページ

| ページ | 内容 |
|--------|------|
| [Home](https://github.com/PROLE-ISLAND/hy-assessment/wiki) | トップページ・目次 |
| [Implementation Plans](https://github.com/PROLE-ISLAND/hy-assessment/wiki/Implementation-Plans) | 実装計画一覧 |
| [Development Rules](https://github.com/PROLE-ISLAND/hy-assessment/wiki/Development-Rules) | 開発ルール概要 |

### Claude Code での使用方法

1. **セッション開始時**: Wiki の Implementation Plans を確認
2. **計画立案時**: 新しい計画を Wiki に追加
3. **作業中断時**: 進捗を Wiki に記録

### Wiki の更新方法

```bash
# Wiki リポジトリをクローン
git clone https://github.com/PROLE-ISLAND/hy-assessment.wiki.git

# 編集後にプッシュ
cd hy-assessment.wiki
git add . && git commit -m "Update implementation plan" && git push
```

### 実装計画テンプレート

```markdown
## [機能名] - Issue #xxx

**ステータス**: 🔵 計画中 / 🟡 実装中 / 🟢 完了

### 概要
[機能の目的と価値]

### 変更対象ファイル
| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `path/to/file.ts` | 新規/修正 | 説明 |

### 実装ステップ
1. [ ] ステップ1
2. [ ] ステップ2

### 依存関係
- 先行: #xxx
- 後続: #xxx
```

---

## E2Eテスト

### 実行方法

```bash
npm run test:e2e              # ヘッドレス実行
npm run test:e2e:ui           # UI付き実行
npx playwright test --headed  # ブラウザ表示で実行
```

### テストファイル

```
e2e/
├── fixtures.ts          # 共通フィクスチャ・セレクタ
├── 00-setup.spec.ts     # 認証セットアップ
├── 01-auth.spec.ts      # 認証テスト
├── 02-candidates.spec.ts # 候補者管理テスト
└── 03-analysis.spec.ts  # 分析機能テスト
```

### data-testid 規則

```
data-testid="add-candidate-button"      # ボタン
data-testid="candidate-name-input"      # 入力フィールド
data-testid="candidate-row-{id}"        # 動的要素
data-testid="candidate-detail-{id}"     # 詳細リンク
```

### レースコンディション防止ルール

**背景**: 非同期操作の競合によるバグ（Issue #78 等）を防ぐためのテストルール

#### E2Eテスト

1. **`waitForTimeout()` 使用禁止** ⚠️ESLintエラー
   - 代わりに決定論的待機を使用:
     - `waitForData()` - データ到着待ち
     - `waitForPageReady()` - ページ完全読み込み待ち
     - `waitForNavigation()` - ナビゲーション完了待ち
   - ヘルパー: `e2e/helpers/deterministic-wait.ts`

2. **非同期フロー完了待ち必須**
   - フォーム送信後は `waitForResponse()` でAPI完了を確認
   - デバウンス操作後はネットワーク完了を待つ

3. **クリティカルフロー専用テスト**
   - 自動保存 + 完了のような複合パターンは専用テストケース作成
   - 例: 検査回答 → 自動保存中 → 送信ボタン押下

#### 単体テスト（Vitest）

1. **Fake Timers 必須**（デバウンス/スロットルのテスト）
   ```typescript
   beforeEach(() => vi.useFakeTimers());
   afterEach(() => vi.useRealTimers());
   ```

2. **レースコンディションテスト**
   - 複数の非同期操作が競合するケースをテスト
   - 例: `completeAssessment()` 呼び出し中に `saveResponse()` が発火
