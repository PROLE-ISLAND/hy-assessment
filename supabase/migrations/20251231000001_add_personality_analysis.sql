-- =====================================================
-- Personality Analysis Fields Migration
-- Adds support for behavioral, stress, EQ, and values analysis
-- Related: Issue #153
-- =====================================================

-- Add new JSONB columns for personality analysis
ALTER TABLE ai_analyses
ADD COLUMN IF NOT EXISTS personality_behavioral JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS personality_stress JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS personality_eq JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS personality_values JSONB DEFAULT NULL;

-- Comments for new columns
COMMENT ON COLUMN ai_analyses.personality_behavioral IS 'DISC-based behavioral analysis: {dominance, influence, steadiness, conscientiousness, traits[], overallType}';
COMMENT ON COLUMN ai_analyses.personality_stress IS 'Stress resilience analysis: {pressureHandling, recoverySpeed, emotionalStability, adaptability, metrics[], overallScore, riskLevel}';
COMMENT ON COLUMN ai_analyses.personality_eq IS 'EQ analysis: {selfAwareness, selfManagement, socialAwareness, relationshipManagement, dimensions[], overallScore}';
COMMENT ON COLUMN ai_analyses.personality_values IS 'Values analysis: {achievement, stability, growth, socialContribution, autonomy, dimensions[], primaryValue}';

-- Index for queries that check if personality analysis exists
CREATE INDEX IF NOT EXISTS idx_ai_analyses_has_personality
ON ai_analyses((personality_behavioral IS NOT NULL))
WHERE personality_behavioral IS NOT NULL;
