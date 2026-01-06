## 1. 調査レポート

**調査レポートリンク**: 親Issue #149 で調査済み

### Investigation Report v1 要約

| 項目 | 内容 |
|------|------|
| 既存システム名 | HY Assessment 組織設定機能 |
| エントリーポイント | UI: `/admin/settings/` / API: `/api/settings/` |
| 主要データモデル | organizations, users, candidates, ai_analyses |
| キーファイル | `src/lib/analysis/personality-prompts.ts`, `src/lib/templates/gfd-gate-v1.ts` |
| 拡張ポイント | 設定画面に新規カード追加、新規APIルート追加、検査テンプレート追加 |
| 破壊ポイント | RLSポリシー設計ミス → データ漏洩リスク |
| やりたいこと（1行） | 職種マスターを作成し、直接測定DISCスコアで配属マッチングを実現する |

### 設計方針の決定

**選択したアプローチ**: **検査分割 + DISC直接測定 + 理想プロファイル**

| 検討アプローチ | 採否 | 理由 |
|---------------|------|------|
| GFD-Gateドメイン重み | ❌ | リスク評価向き、職種適性には不向き |
| パーソナリティ分析（AI推定） | ❌ | GFD-Gateからの間接推定で精度に課題 |
| **DISC直接測定 + 理想プロファイル** | ✅ | 専用質問で直接測定、精度向上 |

### 検査アーキテクチャ（分割設計）

```
┌─────────────────────────────────────────────────────────────┐
│                    検査システム                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  【検査1】GFD-Gate検査（既存・変更なし）                      │
│  ├─ 目的: リスク評価・適合性判定                            │
│  ├─ 質問: 46 Likert + 6 SJT + 1 自由記述                   │
│  ├─ 時間: 15-20分                                          │
│  └─ 出力: 6ドメインスコア（GOV/CONFLICT/REL/COG/WORK/VALID）│
│                                                             │
│  【検査2】DISC検査（新規追加）★ このIssueのスコープ         │
│  ├─ 目的: 職務適性・配属マッチング                          │
│  ├─ 質問: 24問（DISC特化・強制選択式）                      │
│  ├─ 時間: 5-8分                                            │
│  └─ 出力: DISCスコア（D/I/S/C 各0-100）                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  【職種マスタ設定】★ このIssueのスコープ                    │
│  ├─ DISC理想プロファイル（D/I/S/C 理想値 + 重み）           │
│  ├─ 重視する価値観（選択式）                                │
│  └─ マッチング計算: 重み付きDISCスコア距離                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### DISC理論について

| 因子 | 名称 | 行動特性 | 高スコアの特徴 |
|------|------|----------|---------------|
| **D** | Dominance（主導性） | 結果志向、決断力、競争心 | リーダーシップ、目標達成志向 |
| **I** | Influence（影響力） | 社交性、説得力、楽観性 | コミュニケーション、チームビルディング |
| **S** | Steadiness（安定性） | 協調性、忍耐力、支援志向 | サポート、継続性、安定した業務 |
| **C** | Conscientiousness（慎重性） | 分析力、正確性、質への拘り | 品質管理、専門性、正確な業務 |

---

## 2. Phase 2: 要件定義・ユースケース

### 2.1 機能概要

| 項目 | 内容 |
|------|------|
| **なぜ必要か（Why）** | 配属推薦の精度向上のため、DISC直接測定と理想プロファイル設定が必要 |
| **誰が使うか（Who）** | 人事担当者（Admin/Recruiter）+ 候補者（DISC検査受験） |
| **何を達成するか（What）** | DISC検査で直接測定 + 職種ごとの理想プロファイルでマッチング |

### 2.2 ユースケース定義（Role × Outcome）

| UC-ID | Role | Outcome | Channel | 説明 |
|-------|------|---------|---------|------|
| **職種マスタ管理** |
| UC-JOB-ADMIN-LIST-WEB | Admin | 職種一覧を確認する | WEB | 職種一覧画面表示 |
| UC-JOB-ADMIN-CREATE-WEB | Admin | 職種を新規作成する | WEB | 職種追加ダイアログから登録 |
| UC-JOB-ADMIN-UPDATE-WEB | Admin | 職種プロファイルを編集する | WEB | 理想スコア・重みの変更 |
| UC-JOB-ADMIN-DELETE-WEB | Admin | 職種を削除する | WEB | 論理削除（ソフトデリート） |
| UC-JOB-RECRUITER-LIST-WEB | Recruiter | 職種一覧を確認する | WEB | 閲覧のみ（編集不可） |
| **DISC検査** |
| UC-DISC-CANDIDATE-TAKE-WEB | Candidate | DISC検査を受験する | WEB | 24問の強制選択式検査 |
| UC-DISC-ADMIN-VIEW-WEB | Admin | DISC結果を確認する | WEB | 候補者詳細でDISCプロファイル表示 |

### 2.3 外部整合性チェック

- [x] 既存設定画面（`/admin/settings/`）のUI/UXパターンに準拠
- [x] 既存RLSポリシーパターン（`organization_id`ベース）に準拠
- [x] 既存API設計パターン（Zod バリデーション、エラーレスポンス形式）に準拠
- [x] 既存検査テンプレート（`src/lib/templates/gfd-gate-v1.ts`）との構造整合性
- [x] 既存候補者フロー（GFD-Gate → 分析）への追加検査挿入

---

## 3. Phase 3: 品質基準

### 3.1 DoD Level 選択

- [ ] Bronze (27観点: 80%カバレッジ)
- [x] Silver (31観点: 85%カバレッジ)
- [ ] Gold (19観点: 95%カバレッジ)

**選定理由**: 新規検査テンプレート + 職種マスター + CRUD APIの基盤機能。後続Phase（マッチングアルゴリズム）の基盤となるため、Silver品質を担保。

### 3.2 Pre-mortem（失敗シナリオ）

| # | 失敗シナリオ | 発生確率 | 対策 | 確認方法 |
|---|-------------|---------|------|---------|
| 1 | RLS設定ミスで他組織のデータが見える | 中 | 既存RLSパターン踏襲 + 統合テスト | RLS境界テストケース実施 |
| 2 | 理想スコア/重みの不正値が保存される | 高 | CHECK制約 + Zodバリデーション | 境界値テスト |
| 3 | DISC検査とGFD-Gateの結果紐付けミス | 中 | candidate_idで関連付け、整合性チェック | 統合テスト |
| 4 | 強制選択式のUI/UXが分かりにくい | 中 | 既存SurveyJS機能活用 + ユーザビリティテスト | E2Eテスト |

---

## 4. Phase 4: 技術設計

### 4.1 データベース設計

**新規テーブル:**

| テーブル名 | 用途 | RLSポリシー |
|-----------|------|------------|
| job_types | 職種マスター（DISC理想プロファイル） | organization_id ベース |
| disc_assessments | DISC検査結果 | organization_id ベース |

#### 4.1.1 職種マスタースキーマ

```sql
CREATE TABLE job_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- =====================================================
    -- DISC理想プロファイル
    -- ideal_*: 理想スコア（0-100）、NULLの場合は考慮しない
    -- weight_*: 重み（0.0-1.0）、マッチング計算時の重要度
    -- =====================================================

    -- Dominance（主導性）: 結果志向、決断力、競争心
    ideal_dominance INTEGER CHECK (ideal_dominance IS NULL OR ideal_dominance BETWEEN 0 AND 100),
    weight_dominance DECIMAL(3,2) DEFAULT 0.5 CHECK (weight_dominance BETWEEN 0.0 AND 1.0),

    -- Influence（影響力）: 社交性、説得力、楽観性
    ideal_influence INTEGER CHECK (ideal_influence IS NULL OR ideal_influence BETWEEN 0 AND 100),
    weight_influence DECIMAL(3,2) DEFAULT 0.5 CHECK (weight_influence BETWEEN 0.0 AND 1.0),

    -- Steadiness（安定性）: 協調性、忍耐力、支援志向
    ideal_steadiness INTEGER CHECK (ideal_steadiness IS NULL OR ideal_steadiness BETWEEN 0 AND 100),
    weight_steadiness DECIMAL(3,2) DEFAULT 0.5 CHECK (weight_steadiness BETWEEN 0.0 AND 1.0),

    -- Conscientiousness（慎重性）: 分析力、正確性、質への拘り
    ideal_conscientiousness INTEGER CHECK (ideal_conscientiousness IS NULL OR ideal_conscientiousness BETWEEN 0 AND 100),
    weight_conscientiousness DECIMAL(3,2) DEFAULT 0.5 CHECK (weight_conscientiousness BETWEEN 0.0 AND 1.0),

    -- =====================================================
    -- 価値観（参考情報）
    -- =====================================================

    -- 重視する価値観（複数選択可）
    preferred_values TEXT[] DEFAULT '{}',

    -- =====================================================
    -- メタデータ
    -- =====================================================
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    UNIQUE(organization_id, name)
);

-- インデックス
CREATE INDEX idx_job_types_organization ON job_types(organization_id) WHERE deleted_at IS NULL;

-- updated_at トリガー
CREATE TRIGGER update_job_types_updated_at
    BEFORE UPDATE ON job_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE job_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view job types in their org" ON job_types
    FOR SELECT USING (organization_id = public.get_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Admins can insert job types" ON job_types
    FOR INSERT WITH CHECK (organization_id = public.get_organization_id());

CREATE POLICY "Admins can update job types" ON job_types
    FOR UPDATE USING (organization_id = public.get_organization_id())
    WITH CHECK (organization_id = public.get_organization_id());

CREATE POLICY "Admins can delete job types" ON job_types
    FOR DELETE USING (organization_id = public.get_organization_id());
```

#### 4.1.2 DISC検査結果スキーマ

```sql
CREATE TABLE disc_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

    -- =====================================================
    -- DISCスコア（直接測定結果）
    -- 各因子: 0-100のスコア
    -- =====================================================

    dominance_score INTEGER NOT NULL CHECK (dominance_score BETWEEN 0 AND 100),
    influence_score INTEGER NOT NULL CHECK (influence_score BETWEEN 0 AND 100),
    steadiness_score INTEGER NOT NULL CHECK (steadiness_score BETWEEN 0 AND 100),
    conscientiousness_score INTEGER NOT NULL CHECK (conscientiousness_score BETWEEN 0 AND 100),

    -- =====================================================
    -- DISCプロファイルタイプ（自動計算）
    -- =====================================================

    -- 主要因子（最高スコアの因子）: 'D', 'I', 'S', 'C'
    primary_factor CHAR(1) NOT NULL CHECK (primary_factor IN ('D', 'I', 'S', 'C')),

    -- プロファイルパターン（上位2因子）: 'DI', 'DC', 'ID', 'IS', 'SC', 'SD', etc.
    profile_pattern VARCHAR(4) NOT NULL,

    -- =====================================================
    -- 検査メタデータ
    -- =====================================================

    -- 回答データ（JSON）: 各質問への回答記録
    responses JSONB NOT NULL DEFAULT '{}',

    -- 検査完了時刻
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 検査所要時間（秒）
    duration_seconds INTEGER,

    -- =====================================================
    -- メタデータ
    -- =====================================================
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 候補者ごとに1件のみ（再検査時は更新）
    UNIQUE(candidate_id)
);

-- インデックス
CREATE INDEX idx_disc_assessments_organization ON disc_assessments(organization_id);
CREATE INDEX idx_disc_assessments_candidate ON disc_assessments(candidate_id);

-- RLS
ALTER TABLE disc_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view disc assessments in their org" ON disc_assessments
    FOR SELECT USING (organization_id = public.get_organization_id());

CREATE POLICY "System can insert disc assessments" ON disc_assessments
    FOR INSERT WITH CHECK (organization_id = public.get_organization_id());

CREATE POLICY "System can update disc assessments" ON disc_assessments
    FOR UPDATE USING (organization_id = public.get_organization_id())
    WITH CHECK (organization_id = public.get_organization_id());
```

#### 職種プロファイル例

| 職種 | D理想 | I理想 | S理想 | C理想 | D重み | I重み | S重み | C重み | 価値観 |
|------|-------|-------|-------|-------|-------|-------|-------|-------|--------|
| 営業職 | 70 | 80 | 50 | 40 | 0.6 | 0.9 | 0.4 | 0.3 | 達成志向 |
| エンジニア | 50 | 40 | 60 | 80 | 0.5 | 0.4 | 0.5 | 0.9 | 成長志向, 自律志向 |
| CS | 40 | 70 | 80 | 60 | 0.4 | 0.7 | 0.9 | 0.6 | 社会貢献志向 |
| 管理職 | 80 | 70 | 50 | 60 | 0.9 | 0.7 | 0.5 | 0.6 | 達成志向 |

### 4.2 DISC検査設計

#### 4.2.1 質問形式（強制選択式）

DISC検査は「強制選択式（Forced-Choice）」を採用:

```
各質問で4つの記述から、
「最も自分に当てはまる」ものを1つ
「最も自分に当てはまらない」ものを1つ
選択する

例: 質問1
┌─────────────────────────────────────────────────────────────┐
│ 以下の記述から、最も当てはまるもの（M）と                      │
│ 最も当てはまらないもの（L）を選んでください                   │
├─────────────────────────────────────────────────────────────┤
│  [ ] (D) 困難な状況でも諦めずに結果を出す                    │
│  [ ] (I) 周囲を巻き込んで楽しい雰囲気を作る                  │
│  [ ] (S) チームメンバーをサポートし安定を保つ                │
│  [ ] (C) 正確な分析に基づいて慎重に判断する                  │
├─────────────────────────────────────────────────────────────┤
│ 最も当てはまる: [D]  最も当てはまらない: [S]                 │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2.2 スコアリングロジック

```typescript
// 24問 × 2回答（Most/Least）= 48ポイント配分
// Most選択: +2ポイント
// Least選択: -1ポイント
// 未選択: 0ポイント

// 各因子の生スコア範囲: -24 〜 +48
// 正規化: 0-100スケール

function calculateDISCScore(responses: Response[]): DISCScores {
  const raw = { D: 0, I: 0, S: 0, C: 0 };

  for (const r of responses) {
    raw[r.mostLike] += 2;
    raw[r.leastLike] -= 1;
  }

  // 正規化（-24〜48 → 0〜100）
  const normalize = (score: number) =>
    Math.round(((score + 24) / 72) * 100);

  return {
    dominance: normalize(raw.D),
    influence: normalize(raw.I),
    steadiness: normalize(raw.S),
    conscientiousness: normalize(raw.C),
  };
}
```

#### 4.2.3 DISC質問テンプレート（24問）

質問は以下のカテゴリからバランスよく配置:

| カテゴリ | 質問数 | 測定内容 |
|---------|--------|---------|
| 仕事への取り組み方 | 6問 | タスク vs 人間関係志向 |
| コミュニケーション | 6問 | 主張性 vs 受容性 |
| 意思決定スタイル | 6問 | スピード vs 正確性 |
| ストレス下の行動 | 6問 | 支配 vs 順応 |

### 4.3 API設計

#### 4.3.1 職種マスターAPI

| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| GET | `/api/settings/job-types` | 職種一覧取得 | 必要 |
| POST | `/api/settings/job-types` | 職種作成 | 必要（Admin） |
| PUT | `/api/settings/job-types/:id` | 職種更新 | 必要（Admin） |
| DELETE | `/api/settings/job-types/:id` | 職種削除（論理） | 必要（Admin） |

#### 4.3.2 DISC検査API

| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| GET | `/api/assessments/disc/template` | DISC検査テンプレート取得 | 必要 |
| POST | `/api/assessments/disc/:candidateId` | DISC検査結果保存 | 必要 |
| GET | `/api/candidates/:id/disc` | 候補者DISC結果取得 | 必要 |

#### リクエスト/レスポンス例

**POST /api/settings/job-types**
```json
{
  "name": "営業職",
  "description": "顧客折衝・提案営業を担当",
  "disc": {
    "dominance": { "ideal": 70, "weight": 0.6 },
    "influence": { "ideal": 80, "weight": 0.9 },
    "steadiness": { "ideal": 50, "weight": 0.4 },
    "conscientiousness": { "ideal": 40, "weight": 0.3 }
  },
  "preferred_values": ["達成志向"]
}
```

**POST /api/assessments/disc/:candidateId**
```json
{
  "responses": [
    { "questionId": "q1", "mostLike": "I", "leastLike": "C" },
    { "questionId": "q2", "mostLike": "D", "leastLike": "S" }
  ],
  "durationSeconds": 420
}
```

**GET /api/candidates/:id/disc**
```json
{
  "disc": {
    "dominance": 65,
    "influence": 78,
    "steadiness": 45,
    "conscientiousness": 52,
    "primaryFactor": "I",
    "profilePattern": "ID",
    "completedAt": "2026-01-07T10:30:00Z"
  }
}
```

### 4.4 UI設計

#### 4.4.1 画面一覧

| 画面名 | パス | コンポーネント | 説明 |
|-------|------|---------------|------|
| 職種設定 | /admin/settings/job-types | JobTypeList | 職種一覧・CRUD |
| DISC検査 | /assessment/disc/:token | DISCAssessment | 候補者向けDISC検査 |
| DISC結果表示 | /admin/candidates/:id | CandidateDISCProfile | 候補者詳細にDISCタブ追加 |

#### 4.4.2 職種設定UI

```
┌─────────────────────────────────────────────────────────────┐
│  職種を編集: 営業職                                  [×]   │
├─────────────────────────────────────────────────────────────┤
│  職種名 *                                                   │
│  [営業職                                              ]     │
│                                                             │
│  説明                                                       │
│  [顧客折衝・提案営業を担当                            ]     │
│                                                             │
│  ══════════════════════════════════════════════════════════ │
│  DISC理想プロファイル                                       │
│  ══════════════════════════════════════════════════════════ │
│                                                             │
│  Dominance（主導性）                    重み: [0.6]         │
│  結果志向、決断力、競争心                                   │
│  理想スコア: [────────────●────] 70                        │
│                                                             │
│  Influence（影響力）                    重み: [0.9]         │
│  社交性、説得力、楽観性                                     │
│  理想スコア: [──────────────●──] 80                        │
│                                                             │
│  Steadiness（安定性）                   重み: [0.4]         │
│  協調性、忍耐力、支援志向                                   │
│  理想スコア: [────────●────────] 50                        │
│                                                             │
│  Conscientiousness（慎重性）            重み: [0.3]         │
│  分析力、正確性、質への拘り                                 │
│  理想スコア: [──────●──────────] 40                        │
│                                                             │
│  ══════════════════════════════════════════════════════════ │
│  価値観                                                     │
│  ══════════════════════════════════════════════════════════ │
│                                                             │
│  重視する価値観（複数選択可）                               │
│  [✓] 達成志向  [ ] 安定志向  [ ] 成長志向                  │
│  [ ] 社会貢献志向  [ ] 自律志向                            │
│                                                             │
│                              [キャンセル] [保存]           │
└─────────────────────────────────────────────────────────────┘
```

#### 4.4.3 DISC検査UI（候補者向け）

```
┌─────────────────────────────────────────────────────────────┐
│  DISC行動特性検査                               進捗: 8/24  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  質問 8                                                     │
│                                                             │
│  以下の4つの記述について:                                   │
│  • 「最も当てはまる」ものを1つ選んでください                 │
│  • 「最も当てはまらない」ものを1つ選んでください             │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [M] [ ] [ ] [L]  困難な状況でも諦めずに結果を出す     │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ [ ] [M] [ ] [ ]  周囲を巻き込んで楽しい雰囲気を作る   │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ [ ] [ ] [ ] [ ]  チームメンバーをサポートし安定を保つ │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ [ ] [ ] [M] [ ]  正確な分析に基づいて慎重に判断する   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  M = 最も当てはまる  L = 最も当てはまらない                  │
│                                                             │
│  [◀ 前へ]                                      [次へ ▶]    │
└─────────────────────────────────────────────────────────────┘
```

#### 4.4.4 バリアント実装チェック

| バリアント | 用途 | data-testid |
|-----------|------|-------------|
| Default | 正常データ表示 | `job-type-list` / `disc-assessment` |
| Loading | スケルトンUI | `*-skeleton` |
| Empty | データなし状態 | `*-empty` |
| Error | エラー + 再試行ボタン | `*-error` |

#### 4.4.5 data-testid命名規則

```
# 職種設定
data-testid="job-type-list"                    # 一覧コンテナ
data-testid="add-job-type-button"              # 追加ボタン
data-testid="job-type-form"                    # フォームダイアログ
data-testid="job-type-name-input"              # 名前入力
data-testid="ideal-dominance-slider"           # D理想スライダー
data-testid="weight-dominance-input"           # D重み入力
data-testid="ideal-influence-slider"           # I理想スライダー
data-testid="weight-influence-input"           # I重み入力
data-testid="ideal-steadiness-slider"          # S理想スライダー
data-testid="weight-steadiness-input"          # S重み入力
data-testid="ideal-conscientiousness-slider"   # C理想スライダー
data-testid="weight-conscientiousness-input"   # C重み入力
data-testid="preferred-values-checkbox"        # 価値観チェックボックス
data-testid="edit-button-{id}"                 # 編集ボタン
data-testid="delete-button-{id}"               # 削除ボタン

# DISC検査
data-testid="disc-assessment"                  # 検査コンテナ
data-testid="disc-question-{n}"                # 質問
data-testid="disc-option-{factor}"             # 選択肢
data-testid="disc-most-like-{factor}"          # 最も当てはまる選択
data-testid="disc-least-like-{factor}"         # 最も当てはまらない選択
data-testid="disc-progress"                    # 進捗表示
data-testid="disc-submit-button"               # 送信ボタン
```

### 4.5 変更ファイル一覧

| ファイルパス | 変更種別 | 概要 |
|-------------|---------|------|
| **データベース** |
| `supabase/migrations/20260107000001_create_job_types.sql` | 新規 | 職種テーブル・RLS |
| `supabase/migrations/20260107000002_create_disc_assessments.sql` | 新規 | DISC結果テーブル・RLS |
| **型定義** |
| `src/types/database.ts` | 修正 | JobType, DISCAssessment型追加 |
| `src/types/job-type.ts` | 新規 | 職種関連型定義 |
| `src/types/disc.ts` | 新規 | DISC関連型定義 |
| **バリデーション** |
| `src/lib/validations/job-type.ts` | 新規 | 職種Zodスキーマ |
| `src/lib/validations/disc.ts` | 新規 | DISC Zodスキーマ |
| **検査テンプレート** |
| `src/lib/templates/disc-v1.ts` | 新規 | DISC検査テンプレート（24問） |
| `src/lib/templates/disc-scoring.ts` | 新規 | DISCスコアリングロジック |
| **職種設定UI** |
| `src/app/admin/settings/page.tsx` | 修正 | 職種設定カード追加 |
| `src/app/admin/settings/job-types/page.tsx` | 新規 | 職種設定画面 |
| `src/components/settings/JobTypeList.tsx` | 新規 | 職種一覧コンポーネント |
| `src/components/settings/JobTypeForm.tsx` | 新規 | 職種フォーム |
| `src/components/settings/DISCProfileSlider.tsx` | 新規 | DISC理想プロファイルスライダー |
| **DISC検査UI** |
| `src/app/assessment/disc/[token]/page.tsx` | 新規 | DISC検査画面 |
| `src/components/assessment/DISCQuestion.tsx` | 新規 | DISC質問コンポーネント |
| `src/components/assessment/DISCProgress.tsx` | 新規 | 進捗表示 |
| **候補者詳細** |
| `src/app/admin/candidates/[id]/page.tsx` | 修正 | DISCタブ追加 |
| `src/components/candidates/DISCProfileCard.tsx` | 新規 | DISCプロファイル表示 |
| **API** |
| `src/app/api/settings/job-types/route.ts` | 新規 | 職種一覧取得・作成API |
| `src/app/api/settings/job-types/[id]/route.ts` | 新規 | 職種更新・削除API |
| `src/app/api/assessments/disc/template/route.ts` | 新規 | DISC検査テンプレートAPI |
| `src/app/api/assessments/disc/[candidateId]/route.ts` | 新規 | DISC結果保存API |
| `src/app/api/candidates/[id]/disc/route.ts` | 新規 | 候補者DISC取得API |

---

## 5. Phase 5: テスト設計

### 5.1 GWT仕様（Silver対象）

```gherkin
Feature: 職種マスター管理

  Background:
    Given Admin権限を持つユーザーでログイン済み
      And 職種設定画面（/admin/settings/job-types）を表示している

  Scenario: 職種を新規作成する（DISC理想プロファイル）
    When 「職種を追加」ボタンをクリック
      And 職種名「営業職」を入力
      And Influence（影響力）の理想スコアを「80」、重みを「0.9」に設定
      And 価値観で「達成志向」をチェック
      And 「保存」ボタンをクリック
    Then ダイアログが閉じる
      And 一覧に「営業職」が表示される

  Scenario: 職種プロファイルを編集する
    Given 「営業職」が登録されている
    When 「営業職」の編集ボタンをクリック
      And Dominance（主導性）の理想スコアを「75」に変更
      And 「保存」ボタンをクリック
    Then 一覧の「営業職」の設定が更新される

Feature: DISC検査

  Background:
    Given 候補者として検査画面にアクセス済み

  Scenario: DISC検査を完了する
    When 24問すべてに回答
      And 「送信」ボタンをクリック
    Then 検査完了画面が表示される
      And DISCスコアがデータベースに保存される

  Scenario: DISC検査結果を確認する
    Given 候補者「山田太郎」のDISC検査が完了している
    When 管理者として候補者詳細画面を開く
    Then DISCプロファイル（D/I/S/Cスコア）が表示される
      And プロファイルパターン（例: "ID"）が表示される
```

### 5.2 単体テスト設計

| 対象 | テストケース | 期待結果 |
|-----|------------|---------|
| JobTypeForm | 正常系: 必須項目入力で送信可能 | 送信コールバック発火 |
| JobTypeForm | 異常系: 名前空で送信不可 | バリデーションエラー表示 |
| DISCProfileSlider | 理想スコア変更 | 0-100の範囲で更新 |
| DISCProfileSlider | 重み変更 | 0.0-1.0の範囲で更新 |
| calculateDISCScore | 正常スコアリング | 正規化された0-100スコア |
| calculateDISCScore | 全てD選択 | D=100に近い値 |
| validateJobType (Zod) | ideal範囲外 | バリデーションエラー |
| validateJobType (Zod) | weight範囲外 | バリデーションエラー |

---

## 6. 受け入れ条件

### データベース
- [ ] job_types テーブル作成（DISC理想プロファイル設計）
- [ ] disc_assessments テーブル作成
- [ ] CHECK制約設定（ideal: 0-100, weight: 0.0-1.0, scores: 0-100）
- [ ] RLSポリシー設定（organization_id ベース）
- [ ] インデックス作成
- [ ] ユニーク制約（organization_id + name / candidate_id）

### DISC検査
- [ ] DISC検査テンプレート（24問）作成
- [ ] 強制選択式UI実装
- [ ] スコアリングロジック実装
- [ ] プロファイルパターン自動計算
- [ ] 検査結果保存API実装

### 職種マスターAPI
- [ ] GET /api/settings/job-types 実装
- [ ] POST /api/settings/job-types 実装
- [ ] PUT /api/settings/job-types/:id 実装
- [ ] DELETE /api/settings/job-types/:id 実装
- [ ] Zod バリデーション実装
- [ ] エラーハンドリング（401/403/400/404/409）

### UI
- [ ] 職種設定画面実装
- [ ] 職種一覧表示（DataTable）
- [ ] 職種追加/編集ダイアログ（DISC理想プロファイルスライダー）
- [ ] DISC検査画面（候補者向け）
- [ ] 候補者詳細にDISCタブ追加
- [ ] 4バリアント実装（Default/Loading/Empty/Error）

### テスト
- [ ] API単体テスト
- [ ] UI単体テスト（Vitest）
- [ ] スコアリングロジックテスト
- [ ] RLS境界テスト
- [ ] E2Eテスト（Silver）

---

## 7. 依存関係

**先行（このPRの前提）:**
- なし（Phase 1 = 最初の実装）

**後続（このPRに依存）:**
- #193 Phase 2 マッチングアルゴリズム（DISCスコアベースのマッチング計算）
- #194 Phase 3 配属推薦表示UI
- #195 Phase 4 部署推薦機能

**マージ順序（Stacked PR）:**
#192 (DB + 検査 + 職種マスター) → #193 (アルゴリズム) → #194 (UI) → #195 (拡張)

---

## 8. スコープ外（Phase 2以降）

以下は本Issueのスコープ外:

- マッチングアルゴリズム実装（#193で対応）
- 候補者×職種マッチング表示（#194で対応）
- 部署マスター・部署推薦（#195で対応）
- ストレス耐性・EQの直接測定（将来拡張）
- GFD-Gate検査の変更（変更なし）
