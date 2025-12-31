# HY Assessment - 開発ルール

> **📚 組織共通ルール**: https://github.com/PROLE-ISLAND/.github/wiki
>
> このドキュメントはリポジトリ固有のルールです。組織共通ルールと併せて参照してください。

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

## コンポーネントバリアント設計

本番品質のUIを実現するため、すべてのコンポーネントは状態パターン（バリアント）を網羅的に設計・実装すること。

### バリアント定義の必須項目

| カテゴリ | バリアント | 必須度 | 説明 | data-testid例 |
|---------|-----------|--------|------|---------------|
| **データ状態** | Default | ⚫必須 | 正常データ表示 | `{component}` |
| | Loading | ⚫必須 | スケルトンUI / スピナー | `{component}-skeleton` |
| | Empty | ⚫必須 | データなし状態 | `{component}-empty` |
| | Error | ⚫必須 | API失敗 / エラー表示 | `{component}-error` |
| **インタラクション** | Disabled | ◯推奨 | 操作不可状態 | `{component}-disabled` |
| | Hover/Focus | △任意 | マウスオーバー/フォーカス | - |
| **データパターン** | Success | ◯推奨 | スコア高 / 成功色 | - |
| | Warning | ◯推奨 | スコア中 / 警告色 | - |
| | Danger | ◯推奨 | スコア低 / 危険色 | - |
| **サイズ** | sm/md/lg | △任意 | 用途に応じたサイズ | - |

### バリアント設計フロー

```
1. 機能要件定義
   ↓
2. バリアント洗い出し（Issueテンプレートのチェックリスト使用）
   ↓
3. v0/Figmaで全バリアント生成
   ↓
4. デザインレビュー（バリアント網羅性確認）
   ↓
5. 実装（Props型でバリアント定義）
   ↓
6. E2Eテスト（バリアント別テストケース）
```

### バリアント実装パターン

```typescript
// 推奨: 早期リターンパターン
export function Component({ data, isLoading, error, onRetry }: Props) {
  if (isLoading) return <ComponentSkeleton data-testid="component-skeleton" />;
  if (error) return <ComponentError error={error} onRetry={onRetry} data-testid="component-error" />;
  if (!data || data.length === 0) return <ComponentEmpty data-testid="component-empty" />;
  return <ComponentDefault data={data} data-testid="component" />;
}
```

### デザインレビュー時のバリアント確認

レビュアーは以下を確認すること:

- [ ] 全必須バリアント（Default/Loading/Empty/Error）がv0/Figmaにあるか
- [ ] 状態遷移が明確か（どの条件でどのバリアントを表示するか）
- [ ] エッジケースが考慮されているか（極端値、長文、空配列等）
- [ ] data-testidがバリアント別に付与されているか
- [ ] E2Eテスト計画にバリアントテストが含まれているか

### コンポーネント分割ルール（PR サイズ制限）

UIコンポーネントを含むPRは**1コンポーネント = 1PR**を原則とする。

#### なぜ分割が必要か
- 大規模PRはレビュー品質が低下する（推奨: 1PR = 200行以下）
- コンポーネント単位でのロールバックが容易
- 並行開発・レビューが可能

#### 分割の基準

| 変更規模 | 対応 |
|---------|------|
| 1コンポーネント + バリアント | 1PR でOK |
| 2-3コンポーネント（関連性高） | 1PR でOK（要説明） |
| 4コンポーネント以上 | **必ず分割** |
| 共通基盤 + 個別コンポーネント | 共通基盤を先にマージ |

#### 分割の手順

```
1. 親Issue作成（機能全体を記述）
   ↓
2. サブIssue/タスク作成（コンポーネント単位）
   - [ ] #101 共通型定義・ベースコンポーネント
   - [ ] #102 BehavioralAnalysisCard
   - [ ] #103 StressResilienceCard
   - [ ] #104 EQAnalysisCard
   - [ ] #105 ValuesAnalysisCard
   ↓
3. 依存順に実装・マージ
   - 共通基盤 → 個別コンポーネント
```

#### PR作成時の確認

大規模変更（300行以上）の場合、以下をPR本文に記載:
- 分割しなかった理由
- または分割予定（後続PR）

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

#### 実装計画時
- 対象DoD Level（Bronze/Silver/Gold）を明示
- 該当するDoD観点を洗い出し、計画に含める

#### 実装時
- Bronze観点（型安全、テスト、Lint）は常に遵守
- セキュリティ観点（入力検証、認可）は該当する場合必須

#### PR作成時
- DoD Levelを選択し、チェックリストを確認
- 未達項目がある場合は理由を記載

### DoD ローカルチェック

PR作成前にローカルで品質基準を確認できるスクリプト:

```bash
npm run check:bronze   # Bronze基準（lint + 型チェック + テスト + ビルド）
npm run check:silver   # Silver基準（Bronze + npm audit）
npm run check:gold     # Gold基準（Silver + E2Eテスト）
```

| Level | チェック内容 |
|-------|-------------|
| Bronze | ESLint, TypeScript型チェック, Vitest（カバレッジ込み）, Next.jsビルド |
| Silver | Bronze + npm audit (high/critical脆弱性チェック) |
| Gold | Silver + Playwright E2Eテスト |

**推奨ワークフロー:**
1. 開発完了 → `npm run check:bronze` で最低基準を確認
2. PR作成前 → 対象DoDレベルに応じたチェックを実行
3. CI失敗時 → ローカルで同じチェックを再現してデバッグ

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

**基本チェック:**
- [ ] モバイルレスポンシブ対応を考慮
- [ ] ダークモードの色を確認
- [ ] アクセシビリティ（コントラスト、フォントサイズ）
- [ ] 既存デザインシステムとの整合性

**バリアントチェック（⚫必須 ◯推奨 △任意）:**
- [ ] ⚫ Default状態（正常データ表示）
- [ ] ⚫ Loading状態（スケルトンUI）
- [ ] ⚫ Empty状態（データなし）
- [ ] ⚫ Error状態（エラー + 再試行）
- [ ] ◯ データパターン別表示（成功/警告/危険）
- [ ] △ Disabled状態（操作不可）
- [ ] △ インタラクション状態（Hover/Focus）

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
## 基本形式（バリアント込み）

「{コンポーネント名}を作成。

### 基本要件
- shadcn/uiコンポーネント使用
- Tailwind CSS
- ダークモード対応（dark:クラス使用）
- 日本語テキスト
- data-testid属性付与

### バリアント（以下すべて作成）
1. **Default** - 正常データ表示
2. **Loading** - スケルトンUI表示（Skeletonコンポーネント使用）
3. **Empty** - 「データがありません」メッセージ + アイコン
4. **Error** - 「読み込みに失敗しました」+ 再試行ボタン

### データパターン（該当する場合）
- 高スコア/成功: emerald系カラー
- 中スコア/警告: amber系カラー
- 低スコア/危険: rose系カラー

### 追加要件
- {具体的な要件}」

## 例：分析結果カード（バリアント込み）

「分析結果スコアカードを作成。

### 基本要件
- shadcn/uiのCard, Badge, Progressコンポーネント使用
- Tailwind CSS
- ダークモード対応
- 日本語テキスト
- data-testid="score-card", "score-card-skeleton", "score-card-empty", "score-card-error"

### バリアント
1. **Default** - スコア表示（0-100）+ 判定バッジ
2. **Loading** - カード形状のスケルトンUI
3. **Empty** - 「分析結果がありません」+ 分析開始ボタン
4. **Error** - 「分析に失敗しました」+ 再分析ボタン

### データパターン
- スコア70以上: emerald + 「優秀」バッジ
- スコア50-69: amber + 「標準」バッジ
- スコア50未満: rose + 「要注意」バッジ」
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
5. **バリアント実装**: 全状態パターンを実装

```typescript
/**
 * ScoreCard component
 * Generated with v0: https://v0.dev/chat/xxxxx
 * Modified: デザインシステム適用、日本語化
 *
 * Variants:
 * - Default: 正常データ表示
 * - Loading: スケルトンUI
 * - Empty: データなし状態
 * - Error: エラー + 再試行
 */

interface ScoreCardProps {
  data?: ScoreData;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function ScoreCard({ data, isLoading, error, onRetry }: ScoreCardProps) {
  if (isLoading) return <ScoreCardSkeleton />;
  if (error) return <ScoreCardError error={error} onRetry={onRetry} />;
  if (!data) return <ScoreCardEmpty />;
  return <ScoreCardDefault data={data} />;
}
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

複数のIssueを同時に開発する場合のルール:

#### 基本方針
- **別ブランチで作業**: 各Issueは独立したブランチで開発
- **mainから分岐**: 必ずmainブランチから新規ブランチを作成
- **早めにPR**: 作業完了したらすぐPR作成

#### Git Worktree による並行開発（推奨）

複数のClaude Codeセッションで並行開発する場合は、**git worktree** を使用して物理的にワーキングディレクトリを分離する。

**ツール**: [git-worktree-runner (gtr)](https://github.com/coderabbitai/git-worktree-runner)

```bash
# 新しいworktree作成（Issue用）
git gtr new feature/issue-21-localstorage

# Claude Codeを起動
git gtr ai feature/issue-21-localstorage

# エディタで開く
git gtr editor feature/issue-21-localstorage

# 一覧表示
git gtr list

# 作業完了後に削除
git gtr rm feature/issue-21-localstorage
```

**設定ファイル**: `.gtrconfig`（リポジトリルート）

| 設定 | 値 |
|------|-----|
| AI tool | `claude` |
| Editor | `cursor` |
| postCreate | `npm install` |

**なぜworktreeが必要か:**
- 同じリポジトリでも**ローカルファイルは1セット**しかない
- 別セッションが `git checkout` すると、未コミット変更が消える
- worktreeなら**物理的に別ディレクトリ**なので安全

#### コンフリクト防止

| 状況 | 対応 |
|------|------|
| 同じファイルを編集する複数Issue | 1つずつ順番に対応（先にマージされた方を優先） |
| 依存関係がある | 依存元を先にマージ、依存先はその後にリベース |
| 独立したIssue | worktreeで並行開発OK |
| 複数セッション同時開発 | **必ずworktree使用** |

#### コンフリクト発生時

```bash
# 1. mainを最新化
git checkout main && git pull

# 2. 作業ブランチをリベース
git checkout feature/issue-xxx
git rebase main

# 3. コンフリクト解消後
git add . && git rebase --continue

# 4. 強制プッシュ（自分のブランチのみ）
git push --force-with-lease
```

#### 関連Issueの判断基準

以下の場合は**1ブランチにまとめることを検討**:
- 同一ファイルの異なる箇所を修正
- 機能的に密結合（一方が他方に依存）
- 同一PRでレビューした方が理解しやすい

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
npm run test:e2e              # 全E2Eテスト実行（ヘッドレス）
npm run test:e2e:gold         # Gold E2Eのみ（本番リリース基準）
npm run test:e2e:integration  # 統合テストのみ（Silver基準）
npm run test:e2e:ui           # UI付き実行
```

### ディレクトリ構成

```
e2e/
├── gold/                    # 🥇 Gold E2E（5本・本番リリース基準）
│   ├── auth.spec.ts         # 管理者ログイン
│   ├── candidates.spec.ts   # 候補者管理
│   ├── analysis.spec.ts     # AI分析
│   ├── navigation.spec.ts   # ナビゲーション
│   └── reports.spec.ts      # レポート出力
│
├── integration/             # 🥈 統合テスト（Silver基準）
│   ├── prompts.spec.ts      # プロンプト管理
│   ├── templates.spec.ts    # テンプレート
│   ├── compare.spec.ts      # 比較機能
│   ├── accessibility.spec.ts # アクセシビリティ
│   └── ...
│
├── fixtures.ts              # 共通フィクスチャ
├── helpers/                 # ヘルパー関数
└── auth.setup.ts            # 認証セットアップ
```

### Gold E2E選定基準（5つのレンズ）

| レンズ | 説明 |
|--------|------|
| ビジネスリスク | 失敗時の事業損失（収益・信頼） |
| ユーザーインパクト | 影響を受けるユーザー数 |
| 技術複雑度 | 統合ポイント・依存関係の複雑さ |
| 障害履歴 | 過去のバグ・フレーキーテスト |
| 変更頻度 | コード変更の頻度 |

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
