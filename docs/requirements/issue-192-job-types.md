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
| やりたいこと（1行） | 職種マスターを作成し、4カテゴリパーソナリティ検査で配属マッチングを実現する |

### 設計方針の決定

**選択したアプローチ**: **検査分割 + 4カテゴリ直接測定 + 理想プロファイル**

| 検討アプローチ | 採否 | 理由 |
|---------------|------|------|
| GFD-Gateドメイン重み | ❌ | リスク評価向き、職種適性には不向き |
| パーソナリティ分析（AI推定） | ❌ | GFD-Gateからの間接推定で精度に課題 |
| **4カテゴリ直接測定 + 理想プロファイル** | ✅ | 専用質問で直接測定、精度向上 |

### 検査アーキテクチャ（分割設計）

```
┌─────────────────────────────────────────────────────────────────────┐
│                         検査システム                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  【検査1】GFD-Gate検査（既存・変更なし）                              │
│  ├─ 目的: リスク評価・適合性判定                                    │
│  ├─ 質問: 46 Likert + 6 SJT + 1 自由記述                           │
│  ├─ 時間: 15-20分                                                  │
│  └─ 出力: 6ドメインスコア（GOV/CONFLICT/REL/COG/WORK/VALID）        │
│                                                                     │
│  【検査2】パーソナリティ検査（新規追加）★ このIssueのスコープ        │
│  ├─ 目的: 職務適性・配属マッチング                                  │
│  ├─ 内容: 以下4カテゴリを測定                                       │
│  │   ├─ DISC（行動特性）: 24問（強制選択式）、D/I/S/C各0-100       │
│  │   ├─ ストレス耐性: 12問（Likert式）、総合+4下位指標             │
│  │   ├─ EQ（感情知性）: 16問（Likert式）、総合+4下位指標           │
│  │   └─ 価値観: 15問（順位付け式）、5価値観スコア                  │
│  └─ 合計: 約67問、15-24分                                           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  【職種マスタ設定】★ このIssueのスコープ                            │
│  ├─ 4カテゴリ理想プロファイル（各指標に理想値 + 重み）               │
│  │   ├─ DISC: D/I/S/C 理想値・重み                                 │
│  │   ├─ ストレス耐性: 理想総合スコア・重み                          │
│  │   ├─ EQ: 理想総合スコア・重み                                    │
│  │   └─ 価値観: 各価値観の理想スコア・重み                          │
│  └─ マッチング計算: 全指標の重み付き距離計算                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### パーソナリティ4カテゴリ詳細

#### 1. DISC（行動特性）

| 因子 | 名称 | 行動特性 | 高スコアの特徴 |
|------|------|----------|---------------|
| **D** | Dominance（主導性） | 結果志向、決断力、競争心 | リーダーシップ、目標達成志向 |
| **I** | Influence（影響力） | 社交性、説得力、楽観性 | コミュニケーション、チームビルディング |
| **S** | Steadiness（安定性） | 協調性、忍耐力、支援志向 | サポート、継続性、安定した業務 |
| **C** | Conscientiousness（慎重性） | 分析力、正確性、質への拘り | 品質管理、専門性、正確な業務 |

#### 2. ストレス耐性

| 指標 | 名称 | 測定内容 |
|------|------|----------|
| **pressureHandling** | プレッシャー耐性 | 締め切り・責任下でのパフォーマンス維持能力 |
| **recoverySpeed** | 回復速度 | ストレス後の立ち直り・リカバリー速度 |
| **emotionalStability** | 感情安定性 | 感情の波に左右されずに行動できる度合い |
| **adaptability** | 適応力 | 変化や予期せぬ状況への対応能力 |
| **overallScore** | 総合スコア | 上記4指標の加重平均 |

**リスクレベル判定**: low（70-100）、medium（40-69）、high（0-39）

#### 3. EQ（感情知性）

| 指標 | 名称 | 測定内容 |
|------|------|----------|
| **selfAwareness** | 自己認識 | 自分の感情・強み・弱みを正確に理解する能力 |
| **selfManagement** | 自己管理 | 感情・衝動をコントロールし、誠実に行動する能力 |
| **socialAwareness** | 社会的認識 | 他者の感情・ニーズ・組織力学を読み取る能力 |
| **relationshipManagement** | 関係管理 | 他者と効果的に協働し、影響を与える能力 |

#### 4. 価値観

| 指標 | 名称 | 測定内容 |
|------|------|----------|
| **achievement** | 達成志向 | 目標達成・成果・昇進を重視する度合い |
| **stability** | 安定志向 | 安定した環境・予測可能性を重視する度合い |
| **growth** | 成長志向 | 学習・スキルアップ・挑戦を重視する度合い |
| **socialContribution** | 社会貢献志向 | 社会への貢献・意義ある仕事を重視する度合い |
| **autonomy** | 自律志向 | 自己決定・独立性・裁量を重視する度合い |

---

## 2. Phase 2: 要件定義・ユースケース

### 2.1 機能概要

| 項目 | 内容 |
|------|------|
| **なぜ必要か（Why）** | 配属推薦の精度向上のため、4カテゴリパーソナリティ直接測定と理想プロファイル設定が必要 |
| **誰が使うか（Who）** | 人事担当者（Admin/Recruiter）+ 候補者（パーソナリティ検査受験） |
| **何を達成するか（What）** | 4カテゴリ検査で直接測定 + 職種ごとの理想プロファイルでマッチング |

### 2.2 ユースケース定義

| UC-ID | Role | Outcome | 説明 |
|-------|------|---------|------|
| UC-JOB-ADMIN-LIST-WEB | Admin | 職種一覧を確認する | 職種一覧画面表示 |
| UC-JOB-ADMIN-CREATE-WEB | Admin | 職種を新規作成する | 職種追加ダイアログ |
| UC-JOB-ADMIN-UPDATE-WEB | Admin | 職種プロファイルを編集する | 理想スコア・重みの変更 |
| UC-JOB-ADMIN-DELETE-WEB | Admin | 職種を削除する | 論理削除 |
| UC-PERSONALITY-CANDIDATE-TAKE-WEB | Candidate | パーソナリティ検査を受験する | 67問複合検査 |
| UC-PERSONALITY-ADMIN-VIEW-WEB | Admin | パーソナリティ結果を確認する | 4カテゴリプロファイル表示 |

---

## 3. Phase 3: 品質基準

### 3.1 DoD Level: Silver

**選定理由**: 後続Phase（マッチングアルゴリズム）の基盤となるため、Silver品質を担保。

---

## 4. Phase 4: 技術設計

### 4.1 データベース設計

**新規テーブル:**

| テーブル名 | 用途 | RLSポリシー |
|-----------|------|------------|
| job_types | 職種マスター（4カテゴリ理想プロファイル） | organization_id ベース |
| personality_assessments | パーソナリティ検査結果（4カテゴリ） | organization_id ベース |

#### 4.1.1 職種マスタースキーマ（4カテゴリ対応）

```sql
CREATE TABLE job_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- DISC理想プロファイル
    ideal_dominance INTEGER CHECK (ideal_dominance IS NULL OR ideal_dominance BETWEEN 0 AND 100),
    weight_dominance DECIMAL(3,2) DEFAULT 0.5 CHECK (weight_dominance BETWEEN 0.0 AND 1.0),
    ideal_influence INTEGER CHECK (ideal_influence IS NULL OR ideal_influence BETWEEN 0 AND 100),
    weight_influence DECIMAL(3,2) DEFAULT 0.5 CHECK (weight_influence BETWEEN 0.0 AND 1.0),
    ideal_steadiness INTEGER CHECK (ideal_steadiness IS NULL OR ideal_steadiness BETWEEN 0 AND 100),
    weight_steadiness DECIMAL(3,2) DEFAULT 0.5 CHECK (weight_steadiness BETWEEN 0.0 AND 1.0),
    ideal_conscientiousness INTEGER CHECK (ideal_conscientiousness IS NULL OR ideal_conscientiousness BETWEEN 0 AND 100),
    weight_conscientiousness DECIMAL(3,2) DEFAULT 0.5 CHECK (weight_conscientiousness BETWEEN 0.0 AND 1.0),

    -- ストレス耐性理想プロファイル
    ideal_stress INTEGER CHECK (ideal_stress IS NULL OR ideal_stress BETWEEN 0 AND 100),
    weight_stress DECIMAL(3,2) DEFAULT 0.5 CHECK (weight_stress BETWEEN 0.0 AND 1.0),
    max_stress_risk VARCHAR(10) DEFAULT 'medium' CHECK (max_stress_risk IN ('low', 'medium', 'high')),

    -- EQ理想プロファイル
    ideal_eq INTEGER CHECK (ideal_eq IS NULL OR ideal_eq BETWEEN 0 AND 100),
    weight_eq DECIMAL(3,2) DEFAULT 0.5 CHECK (weight_eq BETWEEN 0.0 AND 1.0),

    -- 価値観理想プロファイル
    ideal_achievement INTEGER CHECK (ideal_achievement IS NULL OR ideal_achievement BETWEEN 0 AND 100),
    weight_achievement DECIMAL(3,2) DEFAULT 0.2 CHECK (weight_achievement BETWEEN 0.0 AND 1.0),
    ideal_stability INTEGER CHECK (ideal_stability IS NULL OR ideal_stability BETWEEN 0 AND 100),
    weight_stability DECIMAL(3,2) DEFAULT 0.2 CHECK (weight_stability BETWEEN 0.0 AND 1.0),
    ideal_growth INTEGER CHECK (ideal_growth IS NULL OR ideal_growth BETWEEN 0 AND 100),
    weight_growth DECIMAL(3,2) DEFAULT 0.2 CHECK (weight_growth BETWEEN 0.0 AND 1.0),
    ideal_social_contribution INTEGER CHECK (ideal_social_contribution IS NULL OR ideal_social_contribution BETWEEN 0 AND 100),
    weight_social_contribution DECIMAL(3,2) DEFAULT 0.2 CHECK (weight_social_contribution BETWEEN 0.0 AND 1.0),
    ideal_autonomy INTEGER CHECK (ideal_autonomy IS NULL OR ideal_autonomy BETWEEN 0 AND 100),
    weight_autonomy DECIMAL(3,2) DEFAULT 0.2 CHECK (weight_autonomy BETWEEN 0.0 AND 1.0),

    -- メタデータ
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    UNIQUE(organization_id, name)
);
```

#### 4.1.2 パーソナリティ検査結果スキーマ

```sql
CREATE TABLE personality_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

    -- DISC
    disc_dominance INTEGER NOT NULL CHECK (disc_dominance BETWEEN 0 AND 100),
    disc_influence INTEGER NOT NULL CHECK (disc_influence BETWEEN 0 AND 100),
    disc_steadiness INTEGER NOT NULL CHECK (disc_steadiness BETWEEN 0 AND 100),
    disc_conscientiousness INTEGER NOT NULL CHECK (disc_conscientiousness BETWEEN 0 AND 100),
    disc_primary_factor CHAR(1) NOT NULL CHECK (disc_primary_factor IN ('D', 'I', 'S', 'C')),
    disc_profile_pattern VARCHAR(4) NOT NULL,

    -- ストレス耐性
    stress_overall INTEGER NOT NULL CHECK (stress_overall BETWEEN 0 AND 100),
    stress_details JSONB NOT NULL DEFAULT '{}',
    stress_risk_level VARCHAR(10) NOT NULL CHECK (stress_risk_level IN ('low', 'medium', 'high')),

    -- EQ
    eq_overall INTEGER NOT NULL CHECK (eq_overall BETWEEN 0 AND 100),
    eq_details JSONB NOT NULL DEFAULT '{}',

    -- 価値観
    values_achievement INTEGER NOT NULL CHECK (values_achievement BETWEEN 0 AND 100),
    values_stability INTEGER NOT NULL CHECK (values_stability BETWEEN 0 AND 100),
    values_growth INTEGER NOT NULL CHECK (values_growth BETWEEN 0 AND 100),
    values_social_contribution INTEGER NOT NULL CHECK (values_social_contribution BETWEEN 0 AND 100),
    values_autonomy INTEGER NOT NULL CHECK (values_autonomy BETWEEN 0 AND 100),
    values_primary VARCHAR(30) NOT NULL,

    -- メタデータ
    responses JSONB NOT NULL DEFAULT '{}',
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(candidate_id)
);
```

#### 職種プロファイル例

| 職種 | D理想 | I理想 | S理想 | C理想 | ストレス | EQ | 主要価値観 |
|------|-------|-------|-------|-------|---------|-----|-----------|
| 営業職 | 70 | 80 | 50 | 40 | 70 | 75 | achievement |
| エンジニア | 50 | 40 | 60 | 80 | 60 | 55 | growth |
| CS | 40 | 70 | 80 | 60 | 65 | 85 | socialContribution |
| 管理職 | 80 | 70 | 50 | 60 | 80 | 80 | achievement |

### 4.2 API設計

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/settings/job-types` | 職種一覧取得 |
| POST | `/api/settings/job-types` | 職種作成 |
| PUT | `/api/settings/job-types/:id` | 職種更新 |
| DELETE | `/api/settings/job-types/:id` | 職種削除 |
| GET | `/api/assessments/personality/template` | 検査テンプレート取得 |
| POST | `/api/assessments/personality/:candidateId` | 検査結果保存 |
| GET | `/api/candidates/:id/personality` | 候補者パーソナリティ取得 |

### 4.3 UI設計

| 画面名 | パス | 説明 |
|-------|------|------|
| 職種設定 | /admin/settings/job-types | 職種一覧・CRUD（4タブ） |
| パーソナリティ検査 | /assessment/personality/:token | 候補者向け67問検査 |
| 結果表示 | /admin/candidates/:id | パーソナリティタブ追加 |

#### V0 UIリンク

| 項目 | URL |
|------|-----|
| **V0 Chat（DISC版）** | https://v0.app/chat/dKKC2svn36k |
| **Demo** | https://demo-kzmiiguzj97ageuvaxx2.vusercontent.net |

---

## 5. 受け入れ条件

### データベース
- [ ] job_types テーブル作成（4カテゴリ理想プロファイル）
- [ ] personality_assessments テーブル作成
- [ ] CHECK制約・RLS設定

### 検査
- [ ] 検査テンプレート（67問）作成
- [ ] 4カテゴリスコアリングロジック実装

### API
- [ ] 職種マスターCRUD API
- [ ] パーソナリティ検査API

### UI
- [ ] 職種設定画面（4タブ）
- [ ] パーソナリティ検査画面
- [ ] 候補者詳細パーソナリティタブ

---

## 6. 依存関係

**後続（このPRに依存）:**
- #193 Phase 2 マッチングアルゴリズム
- #194 Phase 3 配属推薦表示UI
- #195 Phase 4 部署推薦機能

**マージ順序:**
#192 → #193 → #194 → #195
