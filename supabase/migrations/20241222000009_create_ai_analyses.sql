-- =====================================================
-- AI Analyses Table (AI-generated analysis results)
-- =====================================================

CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    scores JSONB NOT NULL DEFAULT '{}',
    strengths JSONB NOT NULL DEFAULT '[]',
    weaknesses JSONB NOT NULL DEFAULT '[]',
    summary TEXT,
    recommendation TEXT,
    model_version TEXT NOT NULL,
    prompt_version TEXT NOT NULL DEFAULT 'v1.0.0',
    tokens_used INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    is_latest BOOLEAN NOT NULL DEFAULT true,
    analyzed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_ai_analyses_organization ON ai_analyses(organization_id);
CREATE INDEX idx_ai_analyses_assessment ON ai_analyses(assessment_id);
CREATE INDEX idx_ai_analyses_latest ON ai_analyses(assessment_id, is_latest) WHERE is_latest = true;

-- Function to set is_latest = false for previous analyses
CREATE OR REPLACE FUNCTION set_previous_analyses_not_latest()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ai_analyses
    SET is_latest = false
    WHERE assessment_id = NEW.assessment_id
      AND id != NEW.id
      AND is_latest = true;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_set_previous_analyses_not_latest
    AFTER INSERT ON ai_analyses
    FOR EACH ROW
    EXECUTE FUNCTION set_previous_analyses_not_latest();

-- Comments
COMMENT ON TABLE ai_analyses IS 'AI-generated analysis results with version history';
COMMENT ON COLUMN ai_analyses.organization_id IS 'Denormalized for RLS performance';
COMMENT ON COLUMN ai_analyses.scores IS 'Category-wise scores (e.g., {"communication": 85, "logic": 92})';
COMMENT ON COLUMN ai_analyses.strengths IS 'List of identified strengths';
COMMENT ON COLUMN ai_analyses.weaknesses IS 'List of identified weaknesses';
COMMENT ON COLUMN ai_analyses.model_version IS 'OpenAI model used (e.g., gpt-4-turbo-2024-04-09)';
COMMENT ON COLUMN ai_analyses.prompt_version IS 'Prompt version for traceability';
COMMENT ON COLUMN ai_analyses.tokens_used IS 'Total tokens used for cost tracking';
COMMENT ON COLUMN ai_analyses.is_latest IS 'True for the most recent analysis';
