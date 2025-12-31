-- =====================================================
-- Personality Analysis Fields Migration
-- Adds support for 4 personality analysis types
-- =====================================================

-- Add personality analysis columns to ai_analyses
ALTER TABLE ai_analyses
ADD COLUMN IF NOT EXISTS behavioral_analysis JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stress_resilience JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS eq_analysis JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS values_analysis JSONB DEFAULT NULL;

-- Comments for new columns
COMMENT ON COLUMN ai_analyses.behavioral_analysis IS 'DISC-based behavioral trait analysis (dominance, influence, steadiness, conscientiousness)';
COMMENT ON COLUMN ai_analyses.stress_resilience IS 'Stress handling and resilience metrics (pressure handling, recovery, emotional stability, adaptability)';
COMMENT ON COLUMN ai_analyses.eq_analysis IS 'Emotional intelligence analysis (self-awareness, self-management, social awareness, relationship management)';
COMMENT ON COLUMN ai_analyses.values_analysis IS 'Values profile analysis (achievement, stability, growth, social contribution, autonomy)';

-- Example JSON structures for reference:
--
-- behavioral_analysis: {
--   "dominance": 75,
--   "influence": 60,
--   "steadiness": 45,
--   "conscientiousness": 80,
--   "traits": [{"name": "決断力", "score": 85, "description": "..."}],
--   "overallType": "DC型（分析者）"
-- }
--
-- stress_resilience: {
--   "pressureHandling": 70,
--   "recoverySpeed": 65,
--   "emotionalStability": 75,
--   "adaptability": 80,
--   "metrics": [{"name": "...", "score": 70, "description": "..."}],
--   "overallScore": 72,
--   "riskLevel": "low"
-- }
--
-- eq_analysis: {
--   "selfAwareness": 80,
--   "selfManagement": 75,
--   "socialAwareness": 70,
--   "relationshipManagement": 85,
--   "dimensions": [{"name": "...", "score": 80, "description": "..."}],
--   "overallScore": 77
-- }
--
-- values_analysis: {
--   "achievement": 85,
--   "stability": 60,
--   "growth": 90,
--   "socialContribution": 70,
--   "autonomy": 75,
--   "dimensions": [{"name": "...", "score": 85, "description": "..."}],
--   "primaryValue": "成長志向"
-- }
