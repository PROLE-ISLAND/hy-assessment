# 詳細実装設計書：AI分析パイプライン

## 概要

MVP要件の残り3つを実装するための詳細設計：
1. ✅ 候補者が検査URLにアクセスして回答（完了）
2. ✅ 回答データがDBに保存（完了）
3. ❌ AIが結果を分析してコメント生成（**本設計書の対象**）
4. ❌ 採用担当者が結果レポートを閲覧（**本設計書の対象**）
5. ❌ PDFでレポート出力（**本設計書の対象**）

---

## Phase 2: AI分析APIエンドポイント

### 2.1 目的
検査完了後、回答データからAI分析を実行し、強み・弱み・推奨事項を生成する。

### 2.2 エンドポイント設計

#### POST `/api/analysis/[assessmentId]`

**リクエスト:**
```typescript
// 認証: 管理者のみ（RLS適用）
// Body: なし（assessmentIdから回答を取得）
```

**レスポンス:**
```typescript
interface AnalysisResponse {
  success: boolean;
  analysisId: string;
  scores: {
    GOV: number;      // 0-100
    CONFLICT: number;
    REL: number;
    COG: number;
    WORK: number;
    VALID: number;
  };
  strengths: string[];     // 強み（3-5項目）
  weaknesses: string[];    // 弱み・注意点（3-5項目）
  summary: string;         // 総合評価（200-300文字）
  recommendation: string;  // 採用判断への推奨事項
  validityFlags: {
    isValid: boolean;
    details: string[];
  };
}
```

**エラーケース:**
| ステータス | 条件 |
|-----------|------|
| 400 | 検査が未完了 |
| 404 | 検査が存在しない |
| 409 | 既に分析済み（再分析はPUTで） |
| 500 | OpenAI API エラー |

### 2.3 処理フロー

```
1. assessmentId から検査データ取得
   └─ status === 'completed' を確認

2. responses テーブルから全回答取得
   └─ 53件（46 Likert + 6 SJT + 1 自由記述）

3. スコア計算エンジン実行（scoring-engine.ts）
   └─ 6ドメインスコア計算
   └─ 妥当性チェック
   └─ SJTスコア計算

4. OpenAI API 呼び出し
   └─ モデル: gpt-4-turbo
   └─ プロンプト: 後述
   └─ response_format: json_object

5. ai_analyses テーブルに保存
   └─ scores, strengths, weaknesses, summary, recommendation
   └─ model_version, prompt_version, tokens_used

6. レスポンス返却
```

### 2.4 OpenAI プロンプト設計

```typescript
// src/lib/analysis/prompts.ts

export const ANALYSIS_SYSTEM_PROMPT = `
あなたは採用適性検査の分析専門家です。
候補者の検査結果から、採用担当者向けの分析レポートを生成します。

## 入力データ
- 6ドメインスコア（GOV/CONFLICT/REL/COG/WORK/VALID）
- SJT回答と選択肢
- 自由記述回答

## 出力フォーマット（JSON）
{
  "strengths": ["強み1", "強み2", "強み3"],
  "weaknesses": ["注意点1", "注意点2", "注意点3"],
  "summary": "総合評価（200-300文字）",
  "recommendation": "採用判断への推奨事項"
}

## 分析ガイドライン
1. 強み・弱みは具体的な行動傾向で記述
2. 批判的すぎず、建設的なトーンを維持
3. 妥当性フラグがある場合は慎重に評価
4. 採用判断の根拠を明確に
`;

export function buildAnalysisPrompt(data: AnalysisInput): string {
  // ドメインスコア、SJT回答、自由記述を含むプロンプト生成
}
```

### 2.5 ファイル構成

```
src/lib/analysis/
├── types.ts              # ✅ 完了
├── scoring-engine.ts     # ✅ 完了
├── prompts.ts            # プロンプトテンプレート
├── ai-analyzer.ts        # OpenAI API連携
└── index.ts              # エクスポート

src/app/api/analysis/
└── [assessmentId]/
    └── route.ts          # API エンドポイント
```

---

## Phase 3: 検査完了時の自動トリガー

### 3.1 目的
検査完了時にバックグラウンドでAI分析を自動実行する。

### 3.2 実装方針

**Option A: 同期実行（シンプル）**
```typescript
// src/app/api/assessment/[token]/complete/route.ts

export async function POST(request, { params }) {
  // 1. 検査を完了状態に更新
  // 2. 分析APIを直接呼び出し
  // 3. 完了ページにリダイレクト
}
```
- メリット: 実装がシンプル
- デメリット: レスポンスが遅くなる（10-30秒）

**Option B: 非同期実行（推奨）**
```typescript
// 完了時は即座にレスポンス
// バックグラウンドで分析実行
// 分析完了後にステータス更新

// assessments.analysis_status: 'pending' | 'processing' | 'completed' | 'failed'
```
- メリット: UXが良い
- デメリット: ポーリングまたはWebSocket必要

### 3.3 MVP推奨: Option A（同期実行）
- 検査完了ページで「分析中...」表示
- 完了後に結果ページへリダイレクト
- タイムアウト対策として30秒上限

---

## Phase 4: 結果一覧・詳細ページUI

### 4.1 検査結果一覧ページ

**URL:** `/admin/assessments`

**表示項目:**
| カラム | 説明 |
|--------|------|
| 候補者名 | person.name |
| 職種 | candidate.position |
| 検査日 | assessment.completed_at |
| ステータス | pending/in_progress/completed/expired |
| 分析状態 | 未分析/分析中/完了 |
| 総合スコア | ai_analysis.scores.overall |
| アクション | 詳細/PDF出力 |

**フィルター:**
- ステータス別
- 日付範囲

### 4.2 検査結果詳細ページ

**URL:** `/admin/assessments/[id]`

**セクション構成:**

```
┌─────────────────────────────────────────┐
│ 基本情報カード                          │
│ ・候補者名、職種、検査日時               │
│ ・総合スコア（大きく表示）               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 6ドメインスコア（レーダーチャート）      │
│ ・GOV, CONFLICT, REL, COG, WORK, VALID  │
│ ・各ドメインのリスクレベル表示           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 強み・弱みカード                        │
│ ・強み 3-5項目（緑）                    │
│ ・注意点 3-5項目（黄/赤）               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ AI分析サマリー                          │
│ ・総合評価（200-300文字）               │
│ ・採用推奨事項                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 妥当性チェック                          │
│ ・注意チェック結果                      │
│ ・一貫性フラグ                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ アクション                              │
│ ・PDF出力ボタン                         │
│ ・再分析ボタン（必要時）                │
└─────────────────────────────────────────┘
```

### 4.3 ファイル構成

```
src/app/admin/assessments/
├── page.tsx              # 一覧ページ
└── [id]/
    └── page.tsx          # 詳細ページ

src/components/analysis/
├── DomainRadarChart.tsx  # レーダーチャート
├── ScoreCard.tsx         # スコア表示カード
├── StrengthWeaknessCard.tsx  # 強み・弱み
├── ValidityBadge.tsx     # 妥当性バッジ
└── index.ts
```

---

## Phase 5: Rechartsグラフ

### 5.1 レーダーチャート（6ドメイン）

**コンポーネント:** `DomainRadarChart`

```typescript
interface DomainRadarChartProps {
  scores: Record<Domain, number>;  // 0-100
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**デザイン:**
- 6軸のレーダーチャート
- ドメイン名を日本語で表示
- スコアに応じた色分け（緑/黄/赤）
- ベンチマーク線（オプション）

### 5.2 バーチャート（ドメイン別詳細）

**コンポーネント:** `DomainBarChart`

```typescript
interface DomainBarChartProps {
  scores: Record<Domain, DomainScore>;
  orientation?: 'horizontal' | 'vertical';
}
```

**デザイン:**
- 横棒グラフ
- リスクレベルで色分け
- パーセンテージ表示

---

## Phase 6: PDF出力

### 6.1 エンドポイント

**GET `/api/analysis/pdf/[assessmentId]`**

**レスポンス:** `application/pdf`

### 6.2 PDF構成

```
┌─────────────────────────────────────────┐
│ ヘッダー                                │
│ ・会社ロゴ（任意）                      │
│ ・「適性検査結果レポート」              │
│ ・発行日                                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 候補者情報                              │
│ ・氏名、職種、検査日                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 総合評価                                │
│ ・総合スコア                            │
│ ・AI分析サマリー                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ドメイン別スコア                        │
│ ・6ドメインの数値とグラフ              │
│ ・各ドメインの説明                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 強み・注意点                            │
│ ・強み一覧                              │
│ ・注意点一覧                            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 採用推奨事項                            │
│ ・面接での確認ポイント                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ フッター                                │
│ ・機密性注意書き                        │
│ ・ページ番号                            │
└─────────────────────────────────────────┘
```

### 6.3 技術実装

**Option A: Puppeteer（推奨）**
- HTMLテンプレートを作成
- PuppeteerでPDF化
- 既にインストール済み

**Option B: @react-pdf/renderer**
- Reactコンポーネントで直接PDF生成
- SSR対応が複雑

### 6.4 ファイル構成

```
src/lib/pdf/
├── templates/
│   └── report.html       # HTMLテンプレート
├── pdf-generator.ts      # PDF生成ロジック
└── styles.css            # PDFスタイル

src/app/api/analysis/pdf/
└── [assessmentId]/
    └── route.ts          # PDFエンドポイント
```

---

## 環境変数

```bash
# .env.local に追加必要
OPENAI_API_KEY=sk-...
```

---

## 実装チェックリスト

### Phase 2: AI分析API
- [ ] `src/lib/analysis/prompts.ts` - プロンプトテンプレート
- [ ] `src/lib/analysis/ai-analyzer.ts` - OpenAI連携
- [ ] `src/lib/analysis/index.ts` - エクスポート
- [ ] `src/app/api/analysis/[assessmentId]/route.ts` - APIエンドポイント
- [ ] 単体テスト

### Phase 3: 自動トリガー
- [ ] `src/app/api/assessment/[token]/complete/route.ts` 修正
- [ ] 分析中UI表示
- [ ] エラーハンドリング

### Phase 4: 結果ページUI
- [ ] `src/app/admin/assessments/page.tsx` - 一覧ページ
- [ ] `src/app/admin/assessments/[id]/page.tsx` - 詳細ページ
- [ ] `src/components/analysis/ScoreCard.tsx`
- [ ] `src/components/analysis/StrengthWeaknessCard.tsx`
- [ ] `src/components/analysis/ValidityBadge.tsx`

### Phase 5: Rechartsグラフ
- [ ] `src/components/analysis/DomainRadarChart.tsx`
- [ ] `src/components/analysis/DomainBarChart.tsx`

### Phase 6: PDF出力
- [ ] `src/lib/pdf/templates/report.html`
- [ ] `src/lib/pdf/pdf-generator.ts`
- [ ] `src/app/api/analysis/pdf/[assessmentId]/route.ts`
- [ ] PDF出力ボタンUI

---

## 見積もり工数

| Phase | 項目 | 推定時間 |
|-------|------|---------|
| 2 | AI分析API | 3-4時間 |
| 3 | 自動トリガー | 1時間 |
| 4 | 結果ページUI | 3-4時間 |
| 5 | Rechartsグラフ | 2時間 |
| 6 | PDF出力 | 2-3時間 |
| **合計** | | **11-14時間** |

---

## リスク・考慮事項

1. **OpenAI APIコスト**
   - GPT-4-turbo使用で1分析あたり約$0.05-0.10
   - 月間100件で$5-10程度

2. **レスポンス時間**
   - AI分析に10-30秒かかる
   - UX向上のため非同期化を検討

3. **妥当性低い回答の扱い**
   - 分析は実行するが警告を表示
   - 採用担当者に判断を委ねる

4. **PDF生成のサーバー負荷**
   - Puppeteerはメモリを消費
   - 同時生成数を制限（最大3件程度）
