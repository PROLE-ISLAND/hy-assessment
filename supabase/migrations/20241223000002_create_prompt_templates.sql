-- =====================================================
-- Prompt Templates Table (AI prompt management)
-- =====================================================

-- Prompt key enum
CREATE TYPE prompt_key AS ENUM ('system', 'analysis_user', 'judgment');

CREATE TABLE prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,  -- NULL = system-wide

    -- Identification
    key prompt_key NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL DEFAULT 'v1.0.0',

    -- Prompt content
    content TEXT NOT NULL,

    -- AI parameters
    model VARCHAR(50) NOT NULL DEFAULT 'gpt-5.2',
    temperature DECIMAL(2,1) NOT NULL DEFAULT 0.3,
    max_tokens INTEGER NOT NULL DEFAULT 1500,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_default BOOLEAN NOT NULL DEFAULT false,

    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_prompt_templates_org ON prompt_templates(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_prompt_templates_org_key ON prompt_templates(organization_id, key) WHERE deleted_at IS NULL;
CREATE INDEX idx_prompt_templates_active ON prompt_templates(organization_id, key, is_active) WHERE is_active = true AND deleted_at IS NULL;

-- Updated_at trigger
CREATE TRIGGER update_prompt_templates_updated_at
    BEFORE UPDATE ON prompt_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one active prompt per org/key
CREATE OR REPLACE FUNCTION ensure_single_active_prompt()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        UPDATE prompt_templates
        SET is_active = false, updated_at = NOW()
        WHERE organization_id IS NOT DISTINCT FROM NEW.organization_id
          AND key = NEW.key
          AND id != NEW.id
          AND is_active = true
          AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_active_prompt
    BEFORE INSERT OR UPDATE OF is_active ON prompt_templates
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION ensure_single_active_prompt();

-- Comments
COMMENT ON TABLE prompt_templates IS 'AI prompt templates with version management';
COMMENT ON COLUMN prompt_templates.organization_id IS 'NULL for system-wide templates, org ID for org-specific';
COMMENT ON COLUMN prompt_templates.key IS 'Prompt type: system (system message), analysis_user (user message), judgment (judgment rules)';
COMMENT ON COLUMN prompt_templates.is_active IS 'Only one active prompt per org/key combination';
COMMENT ON COLUMN prompt_templates.is_default IS 'True for system default templates that can be copied';

-- =====================================================
-- RLS Policies for prompt_templates
-- =====================================================

ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- Users can view system-wide templates and their org's templates
CREATE POLICY "Users can view prompt templates"
    ON prompt_templates FOR SELECT
    USING (
        deleted_at IS NULL AND (
            organization_id IS NULL  -- System-wide templates
            OR organization_id = public.get_organization_id()  -- Org-specific templates
        )
    );

-- Admins can insert org-specific templates
CREATE POLICY "Admins can insert prompt templates"
    ON prompt_templates FOR INSERT
    WITH CHECK (
        organization_id = public.get_organization_id()
    );

-- Admins can update their org's templates
CREATE POLICY "Admins can update prompt templates"
    ON prompt_templates FOR UPDATE
    USING (organization_id = public.get_organization_id())
    WITH CHECK (organization_id = public.get_organization_id());

-- Admins can soft-delete their org's templates
CREATE POLICY "Admins can delete prompt templates"
    ON prompt_templates FOR DELETE
    USING (organization_id = public.get_organization_id());

-- =====================================================
-- Seed default system prompts
-- =====================================================

INSERT INTO prompt_templates (organization_id, key, name, description, version, content, model, temperature, max_tokens, is_active, is_default)
VALUES
    -- System prompt (default)
    (NULL, 'system', 'Default System Prompt', 'Standard system prompt for AI analysis', 'v1.0.0',
     'あなたは採用適性検査の分析専門家です。
候補者の検査結果から、採用担当者向けの分析レポートを生成します。

## 分析ガイドライン
1. 強み・注意点は具体的な行動傾向で記述する
2. 批判的すぎず、建設的なトーンを維持する
3. 妥当性フラグがある場合は慎重に評価する
4. 採用判断の根拠を明確にする
5. 日本語で回答する

## 出力フォーマット（JSON）
必ず以下の形式でJSONを返してください：
{
  "strengths": ["強み1", "強み2", "強み3"],
  "weaknesses": ["注意点1", "注意点2", "注意点3"],
  "summary": "総合評価（200-300文字）",
  "recommendation": "採用判断への推奨事項（100-200文字）"
}

注意：
- strengthsは3-5項目
- weaknessesは3-5項目
- 各項目は具体的な行動傾向を記述（例：「ルールを重視し、手順を省略しない傾向がある」）
- summaryは候補者の全体像を簡潔に説明
- recommendationは面接での確認ポイントや採用判断のアドバイス',
     'gpt-5.2', 0.3, 1500, true, true);
