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
