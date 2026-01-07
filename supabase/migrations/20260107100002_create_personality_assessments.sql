-- =====================================================
-- Migration: personality_assessments テーブル作成
-- Issue: #192 職種マスター設定機能
-- Phase: 1-A (DB層)
-- =====================================================

-- personality_assessments テーブル（4カテゴリ検査結果）
CREATE TABLE IF NOT EXISTS personality_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

    -- DISC（行動特性）
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

    -- EQ（感情知性）
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

    -- 制約: 1候補者につき1検査結果
    UNIQUE(candidate_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_personality_organization ON personality_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_personality_candidate ON personality_assessments(candidate_id);

-- RLS有効化
ALTER TABLE personality_assessments ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: SELECT - 自組織のデータのみ
CREATE POLICY personality_select ON personality_assessments FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- RLSポリシー: INSERT - 検査システム経由（サービスロール使用）
-- Note: 候補者が検査を完了した際にサービスロールで挿入
CREATE POLICY personality_insert ON personality_assessments FOR INSERT
    WITH CHECK (true);

-- コメント
COMMENT ON TABLE personality_assessments IS 'パーソナリティ検査結果（4カテゴリ）';
COMMENT ON COLUMN personality_assessments.disc_dominance IS 'DISC D因子スコア（0-100）: 主導性・決断力';
COMMENT ON COLUMN personality_assessments.disc_influence IS 'DISC I因子スコア（0-100）: 影響力・社交性';
COMMENT ON COLUMN personality_assessments.disc_steadiness IS 'DISC S因子スコア（0-100）: 安定性・協調性';
COMMENT ON COLUMN personality_assessments.disc_conscientiousness IS 'DISC C因子スコア（0-100）: 慎重性・正確性';
COMMENT ON COLUMN personality_assessments.disc_primary_factor IS 'DISC主要因子（D/I/S/C）';
COMMENT ON COLUMN personality_assessments.disc_profile_pattern IS 'DISCプロファイルパターン（例: DISC, DiSc）';
COMMENT ON COLUMN personality_assessments.stress_overall IS 'ストレス耐性総合スコア（0-100）';
COMMENT ON COLUMN personality_assessments.stress_details IS 'ストレス耐性詳細（pressureHandling, recoverySpeed, emotionalStability, adaptability）';
COMMENT ON COLUMN personality_assessments.stress_risk_level IS 'ストレスリスクレベル（low: 70-100, medium: 40-69, high: 0-39）';
COMMENT ON COLUMN personality_assessments.eq_overall IS 'EQ総合スコア（0-100）';
COMMENT ON COLUMN personality_assessments.eq_details IS 'EQ詳細（selfAwareness, selfManagement, socialAwareness, relationshipManagement）';
COMMENT ON COLUMN personality_assessments.values_achievement IS '達成志向スコア（0-100）';
COMMENT ON COLUMN personality_assessments.values_stability IS '安定志向スコア（0-100）';
COMMENT ON COLUMN personality_assessments.values_growth IS '成長志向スコア（0-100）';
COMMENT ON COLUMN personality_assessments.values_social_contribution IS '社会貢献志向スコア（0-100）';
COMMENT ON COLUMN personality_assessments.values_autonomy IS '自律志向スコア（0-100）';
COMMENT ON COLUMN personality_assessments.values_primary IS '主要価値観タイプ';
COMMENT ON COLUMN personality_assessments.responses IS '検査回答データ（JSON）';
COMMENT ON COLUMN personality_assessments.duration_seconds IS '検査所要時間（秒）';
