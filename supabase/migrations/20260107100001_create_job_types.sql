-- =====================================================
-- Migration: job_types テーブル作成
-- Issue: #192 職種マスター設定機能
-- Phase: 1-A (DB層)
-- =====================================================

-- job_types テーブル（4カテゴリ理想プロファイル）
CREATE TABLE IF NOT EXISTS job_types (
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

    -- 制約: 同一組織内で職種名はユニーク
    UNIQUE(organization_id, name)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_job_types_organization ON job_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_types_active ON job_types(organization_id, is_active) WHERE deleted_at IS NULL;

-- RLS有効化
ALTER TABLE job_types ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: SELECT - 自組織のデータのみ
CREATE POLICY job_types_select ON job_types FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- RLSポリシー: INSERT - 管理者のみ
CREATE POLICY job_types_insert ON job_types FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin'));

-- RLSポリシー: UPDATE - 管理者のみ
CREATE POLICY job_types_update ON job_types FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin'));

-- RLSポリシー: DELETE - 管理者のみ
CREATE POLICY job_types_delete ON job_types FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin'));

-- updated_atトリガー
CREATE TRIGGER set_job_types_updated_at
    BEFORE UPDATE ON job_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- コメント
COMMENT ON TABLE job_types IS '職種マスター（4カテゴリ理想プロファイル）';
COMMENT ON COLUMN job_types.ideal_dominance IS 'DISC D因子の理想スコア（0-100）';
COMMENT ON COLUMN job_types.weight_dominance IS 'DISC D因子の重み（0.0-1.0）';
COMMENT ON COLUMN job_types.ideal_influence IS 'DISC I因子の理想スコア（0-100）';
COMMENT ON COLUMN job_types.weight_influence IS 'DISC I因子の重み（0.0-1.0）';
COMMENT ON COLUMN job_types.ideal_steadiness IS 'DISC S因子の理想スコア（0-100）';
COMMENT ON COLUMN job_types.weight_steadiness IS 'DISC S因子の重み（0.0-1.0）';
COMMENT ON COLUMN job_types.ideal_conscientiousness IS 'DISC C因子の理想スコア（0-100）';
COMMENT ON COLUMN job_types.weight_conscientiousness IS 'DISC C因子の重み（0.0-1.0）';
COMMENT ON COLUMN job_types.ideal_stress IS 'ストレス耐性の理想スコア（0-100）';
COMMENT ON COLUMN job_types.weight_stress IS 'ストレス耐性の重み（0.0-1.0）';
COMMENT ON COLUMN job_types.max_stress_risk IS '許容ストレスリスクレベル（low/medium/high）';
COMMENT ON COLUMN job_types.ideal_eq IS 'EQの理想スコア（0-100）';
COMMENT ON COLUMN job_types.weight_eq IS 'EQの重み（0.0-1.0）';
COMMENT ON COLUMN job_types.ideal_achievement IS '達成志向の理想スコア（0-100）';
COMMENT ON COLUMN job_types.ideal_stability IS '安定志向の理想スコア（0-100）';
COMMENT ON COLUMN job_types.ideal_growth IS '成長志向の理想スコア（0-100）';
COMMENT ON COLUMN job_types.ideal_social_contribution IS '社会貢献志向の理想スコア（0-100）';
COMMENT ON COLUMN job_types.ideal_autonomy IS '自律志向の理想スコア（0-100）';
