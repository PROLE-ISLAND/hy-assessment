-- =====================================================
-- Responses Table (Assessment answers)
-- =====================================================

CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    answer JSONB NOT NULL,
    page_number INTEGER NOT NULL DEFAULT 1,
    answered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- One answer per question per assessment
    CONSTRAINT unique_response_per_question UNIQUE (assessment_id, question_id)
);

-- Indexes
CREATE INDEX idx_responses_organization ON responses(organization_id);
CREATE INDEX idx_responses_assessment ON responses(assessment_id);

-- Comments
COMMENT ON TABLE responses IS 'Candidate responses to assessment questions';
COMMENT ON COLUMN responses.organization_id IS 'Denormalized for RLS performance';
COMMENT ON COLUMN responses.question_id IS 'Question identifier from SurveyJS';
COMMENT ON COLUMN responses.answer IS 'Answer value (flexible JSONB for any format)';
