-- =====================================================
-- Assessment Types Table (Master data)
-- =====================================================

CREATE TABLE assessment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    default_validity_days INTEGER NOT NULL DEFAULT 7,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Code must be unique within organization (or system-wide if org is NULL)
    CONSTRAINT unique_assessment_type_code UNIQUE (organization_id, code)
);

-- Indexes
CREATE INDEX idx_assessment_types_organization ON assessment_types(organization_id);
CREATE INDEX idx_assessment_types_code ON assessment_types(code);

-- Insert default system-wide assessment types
INSERT INTO assessment_types (organization_id, code, name, default_validity_days) VALUES
    (NULL, 'pre_hire', '入社前検査', 7),
    (NULL, 'post_hire', '入社後検査', 14),
    (NULL, 'periodic_3m', '3ヶ月定点検査', 14),
    (NULL, 'periodic_6m', '6ヶ月定点検査', 14),
    (NULL, 'periodic_1y', '1年定点検査', 14);

-- Comments
COMMENT ON TABLE assessment_types IS 'Assessment type master data';
COMMENT ON COLUMN assessment_types.organization_id IS 'NULL for system-wide types, set for org-specific';
COMMENT ON COLUMN assessment_types.code IS 'Unique code for the assessment type';
COMMENT ON COLUMN assessment_types.default_validity_days IS 'Default days before assessment expires';
