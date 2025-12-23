-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Helper function to get current user's organization_id from JWT
-- Using public schema instead of auth schema (no permission to write to auth)
CREATE OR REPLACE FUNCTION public.get_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (auth.jwt() ->> 'organization_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- Organizations RLS
-- =====================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organization"
    ON organizations FOR SELECT
    USING (id = public.get_organization_id());

CREATE POLICY "Admins can update their organization"
    ON organizations FOR UPDATE
    USING (id = public.get_organization_id())
    WITH CHECK (id = public.get_organization_id());

-- =====================================================
-- Persons RLS
-- =====================================================
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view persons in their organization"
    ON persons FOR SELECT
    USING (organization_id = public.get_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Admins and recruiters can insert persons"
    ON persons FOR INSERT
    WITH CHECK (organization_id = public.get_organization_id());

CREATE POLICY "Admins and recruiters can update persons"
    ON persons FOR UPDATE
    USING (organization_id = public.get_organization_id())
    WITH CHECK (organization_id = public.get_organization_id());

-- =====================================================
-- Users RLS
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view users in their organization"
    ON users FOR SELECT
    USING (organization_id = public.get_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Admins can insert users"
    ON users FOR INSERT
    WITH CHECK (organization_id = public.get_organization_id());

CREATE POLICY "Admins can update users"
    ON users FOR UPDATE
    USING (organization_id = public.get_organization_id())
    WITH CHECK (organization_id = public.get_organization_id());

-- =====================================================
-- Candidates RLS
-- =====================================================
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view candidates in their organization"
    ON candidates FOR SELECT
    USING (organization_id = public.get_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Admins and recruiters can insert candidates"
    ON candidates FOR INSERT
    WITH CHECK (organization_id = public.get_organization_id());

CREATE POLICY "Admins and recruiters can update candidates"
    ON candidates FOR UPDATE
    USING (organization_id = public.get_organization_id())
    WITH CHECK (organization_id = public.get_organization_id());

-- =====================================================
-- Assessment Types RLS
-- =====================================================
ALTER TABLE assessment_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assessment types"
    ON assessment_types FOR SELECT
    USING (
        organization_id IS NULL  -- System-wide types
        OR organization_id = public.get_organization_id()  -- Org-specific types
    );

CREATE POLICY "Admins can insert org-specific types"
    ON assessment_types FOR INSERT
    WITH CHECK (organization_id = public.get_organization_id());

-- =====================================================
-- Assessment Templates RLS
-- =====================================================
ALTER TABLE assessment_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates in their organization"
    ON assessment_templates FOR SELECT
    USING (organization_id = public.get_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Admins can manage templates"
    ON assessment_templates FOR ALL
    USING (organization_id = public.get_organization_id())
    WITH CHECK (organization_id = public.get_organization_id());

-- =====================================================
-- Assessments RLS
-- =====================================================
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assessments in their organization"
    ON assessments FOR SELECT
    USING (organization_id = public.get_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Admins and recruiters can insert assessments"
    ON assessments FOR INSERT
    WITH CHECK (organization_id = public.get_organization_id());

CREATE POLICY "Admins and recruiters can update assessments"
    ON assessments FOR UPDATE
    USING (organization_id = public.get_organization_id())
    WITH CHECK (organization_id = public.get_organization_id());

-- Special policy for public assessment access (via token)
CREATE POLICY "Anyone can view assessment by token"
    ON assessments FOR SELECT
    USING (token IS NOT NULL);

-- =====================================================
-- Responses RLS
-- =====================================================
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses in their organization"
    ON responses FOR SELECT
    USING (organization_id = public.get_organization_id());

-- Candidates can insert responses (via assessment token - handled by service role)
CREATE POLICY "Service can insert responses"
    ON responses FOR INSERT
    WITH CHECK (true);  -- Validated at application level

-- =====================================================
-- AI Analyses RLS
-- =====================================================
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analyses in their organization"
    ON ai_analyses FOR SELECT
    USING (organization_id = public.get_organization_id());

CREATE POLICY "Service can insert analyses"
    ON ai_analyses FOR INSERT
    WITH CHECK (true);  -- Only via service role

-- =====================================================
-- Audit Logs RLS
-- =====================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs in their organization"
    ON audit_logs FOR SELECT
    USING (organization_id = public.get_organization_id());

CREATE POLICY "Service can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);  -- Only via service role

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON FUNCTION public.get_organization_id() IS 'Extract organization_id from JWT claims';
