-- =====================================================
-- Candidates Table (Job candidates)
-- =====================================================

CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    position TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_candidates_organization ON candidates(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_candidates_person ON candidates(person_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_candidates_position ON candidates(position) WHERE deleted_at IS NULL;

-- Updated_at trigger
CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE candidates IS 'Job candidates (references person)';
COMMENT ON COLUMN candidates.position IS 'Applied position';
COMMENT ON COLUMN candidates.notes IS 'Internal notes about candidate';
