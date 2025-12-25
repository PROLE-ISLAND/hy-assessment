# HY Assessment - 開発ルール

## プロジェクト概要
入社前適性検査システム（SaaS対応マルチテナント設計）

## 言語・ローカライゼーション

### UI テキストは日本語で記述
- ボタン、ラベル、メッセージはすべて日本語
- shadcn/ui コンポーネント使用時もテキストは日本語に置き換え
- プレースホルダーも日本語（例: `placeholder="メールアドレス"`）

### コード・コメントは英語
- 変数名、関数名は英語
- コメントは英語（必要に応じて日本語補足可）
- コミットメッセージは英語

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
| `OPENAI_DEFAULT_MODEL` | デフォルトモデル | `gpt-5.2` |

### 利用可能なモデル（2024-12時点）
- `gpt-5.2` / `gpt-5.2-pro` (最新)
- `gpt-5.1` / `gpt-5`
- `gpt-4.1` / `gpt-4.1-mini`
- `gpt-4o` / `gpt-4o-mini`
- `gpt-4-turbo`

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

### DoD (Definition of Done) レベル

| レベル | カバレッジ | 用途 |
|-------|-----------|------|
| Bronze | 80%以上 | プロトタイプ |
| Silver | 85%以上 | 開発版（推奨） |
| Gold | 95%以上 | 本番品質 |

### 開発フロー

```
1. Issue作成 → DoD Level選択 → Label付与
2. ブランチ作成: feature/issue-{番号}-{説明}
3. Claude Code / Copilot で開発
4. PR作成 → CI自動実行 → Quality Gate判定
5. レビュー → 承認 → マージ → 自動デプロイ
```

### ブランチ命名規則

```
feature/issue-123-add-pdf-export
bugfix/issue-456-fix-login-error
hotfix/issue-789-critical-fix
```

### 必要なGitHub Secrets

| Secret名 | 用途 |
|----------|------|
| `VERCEL_TOKEN` | Vercel APIトークン |
| `VERCEL_ORG_ID` | Vercel Organization ID |
| `VERCEL_PROJECT_ID` | Vercel Project ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `CODECOV_TOKEN` | Codecovトークン（任意） |

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
