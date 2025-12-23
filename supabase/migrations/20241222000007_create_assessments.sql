-- =====================================================
-- Assessments Table (Assessment sessions)
-- =====================================================

-- Status enum
CREATE TYPE assessment_status AS ENUM ('pending', 'in_progress', 'completed', 'expired');

CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES assessment_templates(id) ON DELETE RESTRICT,
    token TEXT NOT NULL UNIQUE,
    status assessment_status NOT NULL DEFAULT 'pending',
    progress JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_assessments_organization ON assessments(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assessments_candidate ON assessments(candidate_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assessments_token ON assessments(token) WHERE deleted_at IS NULL;
CREATE INDEX idx_assessments_status ON assessments(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_assessments_expires_at ON assessments(expires_at) WHERE deleted_at IS NULL AND status != 'completed';

-- Updated_at trigger
CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE assessments IS 'Assessment sessions for candidates';
COMMENT ON COLUMN assessments.token IS 'Unique access token for assessment URL';
COMMENT ON COLUMN assessments.progress IS 'Current progress state (page, answered questions, etc.)';
COMMENT ON COLUMN assessments.expires_at IS 'Assessment expiration timestamp';
