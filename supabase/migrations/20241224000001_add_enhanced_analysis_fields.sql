-- =====================================================
-- Enhanced AI Analysis Fields Migration
-- Adds support for v2 enhanced reports and candidate reports
-- =====================================================

-- Add new columns for enhanced analysis (v2)
ALTER TABLE ai_analyses
ADD COLUMN IF NOT EXISTS enhanced_strengths JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS enhanced_watchouts JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS risk_scenarios JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS interview_checks JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS candidate_report JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS report_version TEXT NOT NULL DEFAULT 'v1';

-- Comments for new columns
COMMENT ON COLUMN ai_analyses.enhanced_strengths IS 'v2 structured strengths with title, behavior, evidence';
COMMENT ON COLUMN ai_analyses.enhanced_watchouts IS 'v2 structured watchouts with title, risk, evidence';
COMMENT ON COLUMN ai_analyses.risk_scenarios IS 'Risk scenarios with condition, symptom, impact, prevention';
COMMENT ON COLUMN ai_analyses.interview_checks IS 'Interview check questions with question, intent, look_for';
COMMENT ON COLUMN ai_analyses.candidate_report IS 'Candidate-facing report (disclosure-ready)';
COMMENT ON COLUMN ai_analyses.report_version IS 'Report format version (v1 = legacy, v2 = enhanced)';

-- Index for report version (useful for queries filtering by version)
CREATE INDEX IF NOT EXISTS idx_ai_analyses_report_version ON ai_analyses(report_version);

-- NOTE: The 'candidate' value for prompt_key enum and the default candidate prompt
-- will be added separately outside of this transaction-based migration.
-- Use the Supabase Dashboard SQL Editor to run:
--   ALTER TYPE prompt_key ADD VALUE IF NOT EXISTS 'candidate';
-- Then insert the default candidate prompt via the admin UI or API.
