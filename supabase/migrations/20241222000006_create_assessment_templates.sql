-- =====================================================
-- Assessment Templates Table
-- =====================================================

CREATE TABLE assessment_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type_id UUID NOT NULL REFERENCES assessment_types(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT 'v1.0.0',
    questions JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_assessment_templates_organization ON assessment_templates(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assessment_templates_type ON assessment_templates(type_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assessment_templates_active ON assessment_templates(is_active) WHERE deleted_at IS NULL;

-- Updated_at trigger
CREATE TRIGGER update_assessment_templates_updated_at
    BEFORE UPDATE ON assessment_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE assessment_templates IS 'Assessment templates with SurveyJS question definitions';
COMMENT ON COLUMN assessment_templates.questions IS 'SurveyJS JSON definition';
COMMENT ON COLUMN assessment_templates.version IS 'Template version for tracking changes';
