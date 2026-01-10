# Issue #193: [Phase 2] マッチングアルゴリズム実装 - 要件定義

> **Phase 2 of 4**: 配属先推薦機能（親Issue #149）

---

## 1. 調査レポート

**調査レポートリンク**:
- 親Issue #149 で調査済み
- Phase 1 要件定義: [issue-192-job-types.md](./issue-192-job-types.md)

### Investigation Report v1 要約

| 項目 | 内容 |
|------|------|
| 既存システム名 | HY Assessment 職種マスター機能（#192で実装済み） |
| エントリーポイント | API: `/api/candidates/[id]/recommendations` |
| 主要データモデル | job_types, personality_assessments, candidates |
| キーファイル | `src/types/database.ts`, `src/app/api/settings/job-types/` |
| 拡張ポイント | 新規lib作成（`src/lib/matching/`）、新規APIルート追加 |
| 破壊ポイント | スコア計算ロジックのバグ → 不正確な配属推薦 |
| やりたいこと（1行） | 4カテゴリパーソナリティと職種理想プロファイルの重み付き距離でマッチングスコアを算出 |

### 設計方針

**選択したアプローチ**: **4カテゴリ重み付きユークリッド距離**

| 検討アプローチ | 採否 | 理由 |
|---------------|------|------|
| コサイン類似度 | ❌ | 方向性重視だがスコア絶対値も重要 |
| 単純ユークリッド距離 | ❌ | 因子の重要度差を反映できない |
| **重み付きユークリッド距離** | ✅ | 各因子の重みを反映、職種特性を考慮可能 |

---

## 2. 要件定義・ユースケース

### 2.1 機能概要

| 項目 | 内容 |
|------|------|
| **なぜ必要か（Why）** | 候補者と職種の適合度を定量的に評価し、配属判断の根拠を提供するため |
| **誰が使うか（Who）** | 人事担当者（Admin/Recruiter） |
| **何を達成するか（What）** | 候補者の4カテゴリパーソナリティと職種理想プロファイルを比較し、0-100のマッチングスコアと推薦理由を出力 |

### 2.2 ユースケース定義（Role × Outcome）

| UC-ID | Role | Outcome | Channel | 説明 |
|-------|------|---------|---------|------|
| UC-MATCH-ADMIN-GET-WEB | Admin | 候補者の配属推薦を取得する | WEB | 推薦API呼び出し |
| UC-MATCH-ADMIN-COMPARE-WEB | Admin | 複数職種との適合度を比較する | WEB | スコア一覧表示 |

### 2.3 カバレッジマトリクス

| Role＼Outcome | GET | COMPARE |
|---------------|:---:|:-------:|
| Admin | ✅ Silver | ✅ Silver |
| Recruiter | ✅ Silver | ✅ Silver |

---

## 3. 品質基準

### 3.1 DoD Level 選択

- [ ] Bronze (27観点: 80%カバレッジ)
- [x] Silver (31観点: 85%カバレッジ) ← 選択
- [ ] Gold (19観点: 95%カバレッジ)

**選定理由**: Phase 1（#192）の基盤上に構築。マッチングアルゴリズムの正確性が後続Phase 3-4の価値に直結するためSilver品質を担保。

### 3.2 Pre-mortem（失敗シナリオ）

| # | 失敗シナリオ | 発生確率 | 対策 | 確認方法 |
|---|-------------|---------|------|---------|
| 1 | **スコア計算誤り** - 重み付き計算のロジックバグ | 中 | 境界値テスト、手計算との照合 | 単体テストで全パターン検証 |
| 2 | **null因子の扱い漏れ** - 理想値未設定時のスコア異常 | 高 | null因子は計算から除外、weight正規化 | null設定パターンのテスト |
| 3 | **ストレスリスク足切り漏れ** - 高リスク候補者を推薦 | 中 | max_stress_riskによる警告フラグ付与 | リスクレベル判定テスト |
| 4 | **推薦理由の不整合** - スコアと理由テキストの矛盾 | 低 | 理由生成ロジックをスコア算出と連動 | 統合テストで整合性確認 |
| 5 | **パフォーマンス劣化** - 職種数増加時のレスポンス遅延 | 低 | N+1回避、バッチ処理 | 負荷テストで確認 |

---

## 4. 技術設計

### 4.1 アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────────┐
│                   マッチングアルゴリズム                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  【入力データ】                                                   │
│  ├─ PersonalityAssessment（候補者）                              │
│  │   ├─ DISC: D/I/S/C 各0-100                                   │
│  │   ├─ ストレス: overall + risk_level                          │
│  │   ├─ EQ: overall                                              │
│  │   └─ 価値観: 5タイプ各0-100                                   │
│  │                                                               │
│  └─ JobType[]（全職種）                                          │
│      ├─ DISC理想プロファイル（ideal + weight）                   │
│      ├─ ストレス理想プロファイル（ideal + weight + max_risk）    │
│      ├─ EQ理想プロファイル（ideal + weight）                     │
│      └─ 価値観理想プロファイル（ideal + weight）                 │
│                                                                 │
│  【処理フロー】                                                   │
│  1. 各カテゴリの重み付き距離計算                                 │
│  2. カテゴリ間の重み付き総合スコア算出                           │
│  3. ストレスリスク足切り判定                                     │
│  4. 推薦理由テキスト生成                                         │
│  5. スコア降順ソート                                             │
│                                                                 │
│  【出力データ】                                                   │
│  └─ Recommendation[]                                             │
│      ├─ jobTypeId, jobTypeName                                   │
│      ├─ score: 0-100                                             │
│      ├─ rank: 1, 2, 3...                                         │
│      ├─ reason: { summary, strengths, concerns }                │
│      └─ warnings: string[] (リスク警告など)                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 アルゴリズム詳細設計

#### 4.2.1 重み付きユークリッド距離

```typescript
/**
 * 重み付きユークリッド距離を計算
 * @param candidate 候補者のスコア配列
 * @param ideal 理想プロファイルのスコア配列
 * @param weights 各因子の重み配列（0-1）
 * @returns 正規化された距離（0-1、0が完全一致）
 */
function weightedEuclideanDistance(
  candidate: (number | null)[],
  ideal: (number | null)[],
  weights: number[]
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < candidate.length; i++) {
    // null因子はスキップ（理想値未設定 = 考慮しない）
    if (candidate[i] === null || ideal[i] === null) continue;

    const diff = (candidate[i]! - ideal[i]!) / 100; // 0-1に正規化
    const weight = weights[i];
    weightedSum += weight * diff * diff;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0; // 全因子未設定時は距離0

  return Math.sqrt(weightedSum / totalWeight);
}
```

#### 4.2.2 マッチングスコア算出

```typescript
/**
 * 4カテゴリのマッチングスコアを算出
 */
interface MatchScore {
  total: number;           // 総合スコア 0-100
  disc: number;            // DISCカテゴリスコア
  stress: number;          // ストレスカテゴリスコア
  eq: number;              // EQカテゴリスコア
  values: number;          // 価値観カテゴリスコア
  stressWarning: boolean;  // ストレスリスク警告
}

function calculateMatchScore(
  candidate: PersonalityAssessment,
  jobType: JobType
): MatchScore {
  // 1. DISCスコア（4因子）
  const discDistance = weightedEuclideanDistance(
    [candidate.disc_dominance, candidate.disc_influence,
     candidate.disc_steadiness, candidate.disc_conscientiousness],
    [jobType.ideal_dominance, jobType.ideal_influence,
     jobType.ideal_steadiness, jobType.ideal_conscientiousness],
    [jobType.weight_dominance, jobType.weight_influence,
     jobType.weight_steadiness, jobType.weight_conscientiousness]
  );
  const discScore = Math.round((1 - discDistance) * 100);

  // 2. ストレススコア（1因子）
  const stressDistance = weightedEuclideanDistance(
    [candidate.stress_overall],
    [jobType.ideal_stress],
    [jobType.weight_stress]
  );
  const stressScore = Math.round((1 - stressDistance) * 100);

  // 3. EQスコア（1因子）
  const eqDistance = weightedEuclideanDistance(
    [candidate.eq_overall],
    [jobType.ideal_eq],
    [jobType.weight_eq]
  );
  const eqScore = Math.round((1 - eqDistance) * 100);

  // 4. 価値観スコア（5因子）
  const valuesDistance = weightedEuclideanDistance(
    [candidate.values_achievement, candidate.values_stability,
     candidate.values_growth, candidate.values_social_contribution,
     candidate.values_autonomy],
    [jobType.ideal_achievement, jobType.ideal_stability,
     jobType.ideal_growth, jobType.ideal_social_contribution,
     jobType.ideal_autonomy],
    [jobType.weight_achievement, jobType.weight_stability,
     jobType.weight_growth, jobType.weight_social_contribution,
     jobType.weight_autonomy]
  );
  const valuesScore = Math.round((1 - valuesDistance) * 100);

  // 5. 総合スコア（各カテゴリの平均）
  // カテゴリ重みは現時点で均等（将来的に設定可能に）
  const total = Math.round((discScore + stressScore + eqScore + valuesScore) / 4);

  // 6. ストレスリスク警告判定
  const riskOrder = { low: 0, medium: 1, high: 2 };
  const stressWarning = riskOrder[candidate.stress_risk_level] >
                        riskOrder[jobType.max_stress_risk];

  return { total, disc: discScore, stress: stressScore,
           eq: eqScore, values: valuesScore, stressWarning };
}
```

#### 4.2.3 推薦理由生成

```typescript
interface RecommendationReason {
  summary: string;      // 1行サマリー
  strengths: string[];  // 強み（マッチしている因子）
  concerns: string[];   // 懸念（乖離が大きい因子）
}

/**
 * テンプレートベースの推薦理由生成
 * 各因子のスコア差から強み・懸念を抽出
 */
function generateReasonText(
  candidate: PersonalityAssessment,
  jobType: JobType,
  matchScore: MatchScore
): RecommendationReason {
  const strengths: string[] = [];
  const concerns: string[] = [];

  // DISC因子の評価
  const discFactors = [
    { name: '主導性(D)', candidate: candidate.disc_dominance,
      ideal: jobType.ideal_dominance },
    { name: '影響力(I)', candidate: candidate.disc_influence,
      ideal: jobType.ideal_influence },
    { name: '安定性(S)', candidate: candidate.disc_steadiness,
      ideal: jobType.ideal_steadiness },
    { name: '慎重性(C)', candidate: candidate.disc_conscientiousness,
      ideal: jobType.ideal_conscientiousness },
  ];

  for (const factor of discFactors) {
    if (factor.ideal === null) continue;
    const diff = factor.candidate - factor.ideal;

    if (Math.abs(diff) <= 10) {
      strengths.push(`${factor.name}が理想に近い`);
    } else if (diff > 20) {
      concerns.push(`${factor.name}が高すぎる可能性`);
    } else if (diff < -20) {
      concerns.push(`${factor.name}がやや低め`);
    }
  }

  // ストレス耐性評価
  if (matchScore.stressWarning) {
    concerns.push('ストレス耐性が職種要件を下回る可能性');
  }

  // サマリー生成
  const summary = matchScore.total >= 80
    ? 'この職種に非常に適合しています'
    : matchScore.total >= 60
    ? '適合度は標準的です'
    : '適合度にやや懸念があります';

  return { summary, strengths: strengths.slice(0, 3),
           concerns: concerns.slice(0, 3) };
}
```

### 4.3 API設計

| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| GET | `/api/candidates/:id/recommendations` | 配属推薦取得 | 必要 |

#### リクエスト

```
GET /api/candidates/123e4567-e89b-12d3-a456-426614174000/recommendations
Authorization: Bearer {token}
```

#### レスポンス

```json
{
  "candidateId": "123e4567-e89b-12d3-a456-426614174000",
  "candidateName": "山田太郎",
  "recommendations": [
    {
      "jobTypeId": "abc...",
      "jobTypeName": "営業職",
      "score": 92,
      "rank": 1,
      "categoryScores": {
        "disc": 95,
        "stress": 88,
        "eq": 90,
        "values": 94
      },
      "reason": {
        "summary": "この職種に非常に適合しています",
        "strengths": [
          "主導性(D)が理想に近い",
          "影響力(I)が理想に近い"
        ],
        "concerns": []
      },
      "warnings": []
    },
    {
      "jobTypeId": "def...",
      "jobTypeName": "エンジニア",
      "score": 65,
      "rank": 2,
      "categoryScores": {
        "disc": 60,
        "stress": 70,
        "eq": 65,
        "values": 65
      },
      "reason": {
        "summary": "適合度は標準的です",
        "strengths": [
          "慎重性(C)が理想に近い"
        ],
        "concerns": [
          "主導性(D)がやや低め"
        ]
      },
      "warnings": ["ストレス耐性が職種要件を下回る可能性"]
    }
  ],
  "generatedAt": "2026-01-09T12:00:00.000Z"
}
```

#### エラーレスポンス

| HTTPステータス | エラーコード | 説明 |
|--------------|-------------|------|
| 401 | unauthorized | 認証エラー |
| 403 | forbidden | 他組織の候補者アクセス |
| 404 | candidate_not_found | 候補者が存在しない |
| 404 | personality_not_found | パーソナリティ検査未実施 |
| 404 | no_job_types | 職種が未設定 |

### 4.4 ファイル構成

| ファイルパス | 変更種別 | 概要 |
|-------------|---------|------|
| `src/lib/matching/types.ts` | 新規 | マッチング関連型定義 |
| `src/lib/matching/calculator.ts` | 新規 | スコア算出ロジック |
| `src/lib/matching/reason-generator.ts` | 新規 | 推薦理由テキスト生成 |
| `src/lib/matching/index.ts` | 新規 | エクスポート |
| `src/app/api/candidates/[id]/recommendations/route.ts` | 新規 | 推薦API |
| `src/lib/matching/__tests__/calculator.test.ts` | 新規 | アルゴリズム単体テスト |
| `src/lib/matching/__tests__/reason-generator.test.ts` | 新規 | 理由生成テスト |
| `src/app/api/candidates/[id]/recommendations/__tests__/route.test.ts` | 新規 | API統合テスト |

---

## 5. テスト設計

### 5.1 単体テスト設計

| 対象関数 | テストケース | 期待結果 |
|---------|------------|---------|
| `weightedEuclideanDistance()` | 完全一致（距離0） | 0を返す |
| `weightedEuclideanDistance()` | 最大乖離（距離1） | 1を返す |
| `weightedEuclideanDistance()` | null因子含む | nullをスキップして計算 |
| `weightedEuclideanDistance()` | 全因子null | 0を返す |
| `weightedEuclideanDistance()` | 重み0の因子 | その因子をスキップ |
| `calculateMatchScore()` | 高マッチ候補者 | 80以上のスコア |
| `calculateMatchScore()` | 低マッチ候補者 | 50以下のスコア |
| `calculateMatchScore()` | ストレスリスク超過 | stressWarning=true |
| `generateReasonText()` | 高スコア | 「非常に適合」を含む |
| `generateReasonText()` | 因子乖離20以上 | concernsに追加 |

### 5.2 統合テスト設計

| テスト対象 | テスト内容 | 前提条件 | 期待結果 |
|-----------|-----------|---------|---------|
| GET /recommendations | 正常取得 | 認証済み、検査済み、職種あり | 200 + 推薦一覧 |
| GET /recommendations | 未認証 | Authヘッダーなし | 401 |
| GET /recommendations | 他組織候補者 | 他組織のcandidateId | 403 |
| GET /recommendations | 検査未実施 | 候補者存在、検査なし | 404 personality_not_found |
| GET /recommendations | 職種未設定 | 検査済み、職種0件 | 404 no_job_types |
| GET /recommendations | スコア順ソート | 複数職種あり | score降順 |

### 5.3 テストカバレッジ目標

| モジュール | 目標カバレッジ | 理由 |
|-----------|--------------|------|
| calculator.ts | 95% | コアロジック、全パターン必須 |
| reason-generator.ts | 85% | テンプレート分岐を網羅 |
| recommendations/route.ts | 85% | エラーパス含む |
| **全体** | **85%+** | Silver基準 |

---

## 6. 受け入れ条件

### アルゴリズム
- [ ] 重み付きユークリッド距離関数実装
- [ ] 4カテゴリマッチングスコア算出実装
- [ ] null因子のスキップ処理
- [ ] ストレスリスク警告フラグ実装
- [ ] 0-100の正規化スコア出力

### 推薦理由
- [ ] テンプレートベース理由生成実装
- [ ] 強み・懸念の自動抽出（各最大3件）
- [ ] 日本語テキスト出力

### API
- [ ] GET /api/candidates/:id/recommendations 実装
- [ ] 候補者パーソナリティ取得
- [ ] 全職種との一括マッチング
- [ ] スコア降順ソート
- [ ] RLSによる組織間分離

### テスト
- [ ] アルゴリズム単体テスト（境界値含む）
- [ ] API統合テスト
- [ ] テストカバレッジ 85%以上

---

## 7. 依存関係

**先行（このPRの前提）:**
- #192 Phase 1 職種マスター設定機能 ✅ 完了

**後続（このPRに依存）:**
- #194 Phase 3 配属推薦表示UI
- #195 Phase 4 部署推薦機能

**マージ順序:**
```
#192 (Phase 1: 職種マスター) ✅ 完了
  → #193 (Phase 2: マッチングアルゴリズム) ← このPR
  → #194 (Phase 3: 配属推薦UI)
  → #195 (Phase 4: 部署推薦)
```

---

## 8. 補足: UI変更なし

このPhase 2はバックエンドのみの実装であり、UI変更は含まない。
- Storybook設計: N/A
- V0リンク: N/A
- バリアント定義: N/A

Phase 3（#194）でUIを実装する。
