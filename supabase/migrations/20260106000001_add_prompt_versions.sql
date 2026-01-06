-- =====================================================
-- Prompt Versions Table (Version History for Prompts)
-- Issue #139: プロンプト直接編集機能の実装
-- =====================================================

-- Create prompt_versions table
CREATE TABLE prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,  -- "1.0.0", "1.1.0", etc.
    content TEXT NOT NULL,
    -- Settings snapshot at time of version
    model VARCHAR(50),
    temperature DECIMAL(2,1),
    max_tokens INTEGER,
    -- Metadata
    change_summary TEXT,           -- 変更内容の要約
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(prompt_id, version)
);

-- Indexes for performance
CREATE INDEX idx_prompt_versions_prompt ON prompt_versions(prompt_id);
CREATE INDEX idx_prompt_versions_created ON prompt_versions(created_at DESC);

-- Comments
COMMENT ON TABLE prompt_versions IS 'Version history for prompt templates';
COMMENT ON COLUMN prompt_versions.prompt_id IS 'Reference to the parent prompt template';
COMMENT ON COLUMN prompt_versions.version IS 'Semantic version string (e.g., v1.0.0)';
COMMENT ON COLUMN prompt_versions.content IS 'Prompt content at this version';
COMMENT ON COLUMN prompt_versions.change_summary IS 'Summary of changes made in this version';

-- =====================================================
-- RLS Policies for prompt_versions
-- =====================================================

ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;

-- Users can view versions of prompts they have access to
CREATE POLICY "Users can view prompt versions"
    ON prompt_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM prompt_templates p
            WHERE p.id = prompt_versions.prompt_id
            AND p.deleted_at IS NULL
            AND (
                p.organization_id IS NULL  -- System templates
                OR p.organization_id = public.get_organization_id()  -- Org templates
            )
        )
    );

-- Admins can insert versions for their org's prompts
CREATE POLICY "Admins can insert prompt versions"
    ON prompt_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM prompt_templates p
            WHERE p.id = prompt_versions.prompt_id
            AND p.organization_id = public.get_organization_id()
        )
    );

-- Prompt versions are immutable (no UPDATE policy)
-- Note: We don't add UPDATE policy because versions should never be modified

-- =====================================================
-- Add current_version to prompt_templates (optional tracking)
-- =====================================================

-- Note: We use the existing 'version' column as the current version
-- and store history in prompt_versions table

-- =====================================================
-- Create initial version entries for existing prompts
-- =====================================================

-- Insert initial versions for all existing org-specific prompts
INSERT INTO prompt_versions (prompt_id, version, content, model, temperature, max_tokens, change_summary, created_by, created_at)
SELECT
    id,
    version,
    content,
    model,
    temperature,
    max_tokens,
    '初版作成',
    created_by,
    created_at
FROM prompt_templates
WHERE organization_id IS NOT NULL
AND deleted_at IS NULL;
