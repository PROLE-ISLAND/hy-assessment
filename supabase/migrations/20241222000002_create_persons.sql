-- =====================================================
-- Persons Table (Abstract person entity)
-- =====================================================

CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,

    -- Unique email within organization
    CONSTRAINT unique_person_email_per_org UNIQUE (organization_id, email)
);

-- Indexes
CREATE INDEX idx_persons_organization ON persons(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_persons_email ON persons(email) WHERE deleted_at IS NULL;

-- Updated_at trigger
CREATE TRIGGER update_persons_updated_at
    BEFORE UPDATE ON persons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE persons IS 'Abstract person entity - can be candidate or employee';
COMMENT ON COLUMN persons.organization_id IS 'FK to organization (multi-tenant)';
