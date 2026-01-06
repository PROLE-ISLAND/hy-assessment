# Issue #192-DB: 職種マスター・パーソナリティ検査 DBマイグレーション

> **Phase 1-A of 3**: Issue #192 を DB → API → UI に分割

---

## 1. 調査レポート

**調査レポートリンク**: [PR #204](https://github.com/PROLE-ISLAND/hy-assessment/pull/204)

### Investigation Report v1 要約

| 項目 | 内容 |
|------|------|
| 既存システム名 | HY Assessment データベース |
| エントリーポイント | UI: — / API: — / CLI: `supabase migration` |
| 主要データモデル | organizations, users, candidates |
| キーファイル（3-10） | `supabase/migrations/*.sql`, `src/types/database.types.ts` |
| 拡張ポイント | 新規テーブル追加、RLSポリシー追加、型定義自動生成 |
| 破壊ポイント | RLSポリシー設計ミス → データ漏洩リスク |
| やりたいこと（1行） | job_types と personality_assessments テーブルを作成し、RLSを設定する |

---

## 2. Phase 2: 要件定義・ユースケース

### 2.1 機能概要

| 項目 | 内容 |
|------|------|
| **なぜ必要か（Why）** | 職種マスターとパーソナリティ検査結果を永続化するDBスキーマが必要 |
| **誰が使うか（Who）** | API層（後続PR #192-API）からのCRUD操作 |
| **何を達成するか（What）** | 2テーブル作成 + RLSポリシー + CHECK制約 + インデックス |

### 2.2 ユースケース定義（Role × Outcome）

> UC-ID命名規則: `UC-{DOMAIN}-{ROLE}-{OUTCOME}-{CHANNEL}`

| UC-ID | Role | Outcome | Channel | 説明 |
|-------|------|---------|---------|------|
| UC-DB-SYSTEM-MIGRATE-CLI | System | DBスキーマを作成する | CLI | マイグレーション実行 |
| UC-DB-SYSTEM-RLS-DB | System | RLSでアクセス制御する | DB | ポリシー適用 |
| UC-DB-SYSTEM-TYPES-CLI | System | 型定義を生成する | CLI | supabase gen types |

### 2.3 Role × Value マトリクス

| Role | 提供する価値 | 受け取る価値 | 関連Outcome |
|------|-------------|-------------|-------------|
| System | スキーマ定義・RLS適用 | — | MIGRATE, RLS, TYPES |
| Admin | — | 安全なデータアクセス | RLS |
| User | — | 組織内データ分離 | RLS |

### 2.4 カバレッジマトリクス（MECE証明）

| Role＼Outcome | MIGRATE | RLS | TYPES |
|---------------|:-------:|:---:|:-----:|
| System | 🟡 Bronze | 🟡 Bronze | 🟡 Bronze |
| Admin | — | 🟡 Bronze | — |
| User | — | 🟡 Bronze | — |

### 2.5 入力ソースチェックリスト（要件網羅性証明）

| 入力ソース | 確認状態 | 抽出UC数 | 備考 |
|-----------|---------|---------|------|
| FEATURES.md / 機能一覧 | N/A | 0 | DB層は機能一覧に含まれない |
| ルーティング定義（app/構造） | N/A | 0 | DB層にルーティングなし |
| DBスキーマ（主要テーブル） | ✅ | 2 | job_types, personality_assessments |
| 既存テストファイル | N/A | 0 | 新規機能 |
| Issue/PR履歴 | ✅ | 1 | PR #204 要件定義 |

### 2.6 外部整合性チェック

- [x] PR #204 のDB設計セクションと整合している
- [x] 既存マイグレーションの命名規則に従っている
- [x] 既存RLSポリシーパターンと整合している
- [x] database.types.ts の自動生成に対応している

---

## 3. Phase 3: 品質基準

### 3.1 DoD Level 選択

- [x] Bronze (27観点: 80%カバレッジ) ← 選択
- [ ] Silver (31観点: 85%カバレッジ)
- [ ] Gold (19観点: 95%カバレッジ)

**選定理由**: DBスキーマのみの変更でUI/API実装は後続PRで行う。マイグレーション成功 + RLS動作確認で十分。

### 3.2 Pre-mortem（失敗シナリオ） ⚠️ 3つ以上必須

| # | 失敗シナリオ | 発生確率 | 対策 | 確認方法 |
|---|-------------|---------|------|---------|
| 1 | **RLSポリシー漏れ** - 他組織のデータが見える | 中 | organization_id 必須、全操作にRLS適用 | 統合テストで他組織アクセス検証 |
| 2 | **マイグレーション失敗** - 本番でテーブル作成失敗 | 低 | ローカル→Staging→本番の段階デプロイ | Staging環境で事前検証 |
| 3 | **CHECK制約バグ** - 範囲外値が入る | 低 | 全スコアカラムに BETWEEN 0 AND 100 制約 | 境界値テスト |
| 4 | **FK制約エラー** - 存在しない参照先 | 低 | CASCADE DELETE設定、参照整合性確認 | FK違反テスト |

---

## 4. Phase 4: 技術設計

### 4.1 データベース設計

**新規テーブル:**

| テーブル名 | 用途 | RLSポリシー |
|-----------|------|------------|
| job_types | 職種マスター（4カテゴリ理想プロファイル） | organization_id ベース |
| personality_assessments | パーソナリティ検査結果（4カテゴリ） | organization_id ベース |

#### CRUD操作マトリクス ⚠️ 必須

| テーブル | Create | Read | Update | Delete | 担当API |
|---------|:------:|:----:|:------:|:------:|---------|
| job_types | ✅ | ✅ | ✅ | ✅（論理削除） | 後続 #192-API |
| personality_assessments | ✅ | ✅ | ❌ | ❌ | 後続 #192-API |

#### RLSテスト観点

| ポリシー名 | 対象操作 | 許可条件 | テストケース |
|-----------|---------|---------|-------------|
| job_types_select | SELECT | auth.uid() in org_users | 自組織の職種のみ取得可能 |
| job_types_insert | INSERT | is_admin(auth.uid()) | 管理者のみ作成可能 |
| job_types_update | UPDATE | is_admin(auth.uid()) | 管理者のみ更新可能 |
| job_types_delete | DELETE | is_admin(auth.uid()) | 管理者のみ削除可能 |
| personality_select | SELECT | auth.uid() in org_users | 自組織の結果のみ取得可能 |
| personality_insert | INSERT | true | 検査完了時に自動作成（サービスロール） |

#### 4.1.1 job_types スキーマ

```sql
-- supabase/migrations/20260107100001_create_job_types.sql

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

-- インデックス
CREATE INDEX idx_job_types_organization ON job_types(organization_id);
CREATE INDEX idx_job_types_active ON job_types(organization_id, is_active) WHERE deleted_at IS NULL;

-- RLSポリシー
ALTER TABLE job_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_types_select ON job_types FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY job_types_insert ON job_types FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY job_types_update ON job_types FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY job_types_delete ON job_types FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin'));

-- updated_at トリガー
CREATE TRIGGER set_job_types_updated_at
    BEFORE UPDATE ON job_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

#### 4.1.2 personality_assessments スキーマ

```sql
-- supabase/migrations/20260107100002_create_personality_assessments.sql

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

-- インデックス
CREATE INDEX idx_personality_organization ON personality_assessments(organization_id);
CREATE INDEX idx_personality_candidate ON personality_assessments(candidate_id);

-- RLSポリシー
ALTER TABLE personality_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY personality_select ON personality_assessments FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY personality_insert ON personality_assessments FOR INSERT
    WITH CHECK (true);  -- 検査システム経由で挿入（サービスロール使用）
```

### 4.4 変更ファイル一覧

| ファイルパス | 変更種別 | 概要 |
|-------------|---------|------|
| `supabase/migrations/20260107100001_create_job_types.sql` | 新規 | job_typesテーブル + RLS + インデックス |
| `supabase/migrations/20260107100002_create_personality_assessments.sql` | 新規 | personality_assessmentsテーブル + RLS |
| `src/types/database.types.ts` | 修正 | 型定義追加（supabase gen types で自動生成） |

---

## 5. Phase 5: テスト設計

### 5.1 Gold E2E候補評価（4つのレンズ）

| レンズ | 質問 | 回答 |
|--------|------|------|
| 行動フォーカス | 実装ではなくユーザー目標を検証しているか？ | いいえ（DB層のみ） |
| 欺瞞耐性 | モック/スタブでは通過できないか？ | いいえ |
| 明確な失敗説明 | 失敗理由を1文で説明できるか？ | はい |
| リスク明示 | このテストがないと何を犠牲にするか説明できるか？ | はい |

**結論**: Gold E2E対象外（DBスキーマのみ、UIなし）

### 5.4 単体テスト設計

| 対象関数/コンポーネント | テストケース | 期待結果 |
|----------------------|------------|---------|
| CHECK制約 | ideal_dominance = 150 | PostgreSQLエラー |
| CHECK制約 | ideal_dominance = -1 | PostgreSQLエラー |
| CHECK制約 | ideal_dominance = 50 | 成功 |
| CHECK制約 | weight_dominance = 1.5 | PostgreSQLエラー |
| UNIQUE制約 | 同名職種を同組織に作成 | PostgreSQLエラー |
| FK制約 | 存在しないorganization_id | PostgreSQLエラー |

### 5.6 統合テスト設計 ⚠️ 必須

#### 5.6.1 DB統合テスト（Phase 4.1 CRUD操作マトリクス対応）

| テスト対象 | テスト内容 | 前提条件 | 期待結果 |
|-----------|-----------|---------|---------|
| RLS job_types SELECT | 自組織の職種取得 | 認証済みユーザー | 自組織のデータのみ |
| RLS job_types SELECT | 他組織の職種取得 | 他組織ユーザー | 空配列 |
| RLS job_types INSERT | Admin作成 | Admin認証 | 成功 |
| RLS job_types INSERT | 非Admin作成 | 一般ユーザー認証 | RLSエラー |
| RLS job_types UPDATE | Admin更新 | Admin認証 | 成功 |
| RLS job_types DELETE | Admin削除 | Admin認証 | 成功 |
| RLS personality SELECT | 自組織の結果取得 | 認証済みユーザー | 自組織のデータのみ |
| RLS personality INSERT | サービスロール挿入 | サービスロール | 成功 |
| CHECK制約 | 範囲外値 | — | PostgreSQLエラー |
| UNIQUE制約 | 重複職種名 | 同組織に同名存在 | PostgreSQLエラー |

#### 5.6.4 統合テスト実装ファイル

| カテゴリ | ファイルパス | フレームワーク |
|---------|-------------|---------------|
| DB統合 | `src/lib/job-types/__tests__/job-types.integration.test.ts` | Vitest + Supabase |
| DB統合 | `src/lib/personality/__tests__/personality.integration.test.ts` | Vitest + Supabase |

---

## 6. 受け入れ条件 ⚠️ 必須

- [ ] job_types テーブル作成（4カテゴリ理想プロファイル全カラム）
- [ ] personality_assessments テーブル作成（4カテゴリ全カラム）
- [ ] CHECK制約が全スコアカラムに適用（0-100, 0.0-1.0）
- [ ] RLSポリシーが両テーブルに適用（organization_id ベース）
- [ ] インデックスが作成されている
- [ ] マイグレーションがローカルで成功
- [ ] `supabase gen types` で型定義が生成される

---

## 7. 依存関係

**先行（このPRの前提）:**
- なし（Phase 1-A = 最初の実装）

**後続（このPRに依存）:**
- #192-API（職種CRUD API + 検査API）
- #192-UI（職種設定画面 + 検査画面）

**マージ順序（Stacked PR）:**
```
#192-DB → #192-API → #192-UI
```
