-- =====================================================
-- Report Sharing Fields Migration
-- Adds support for sharing candidate reports via token-based public access
-- =====================================================

-- Add new columns for report sharing
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS report_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS report_shared_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS report_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS report_viewed_at TIMESTAMPTZ;

-- Index for efficient token lookup (partial index for non-null tokens only)
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessments_report_token
ON assessments(report_token)
WHERE report_token IS NOT NULL;

-- Index for expiration check queries
CREATE INDEX IF NOT EXISTS idx_assessments_report_expires_at
ON assessments(report_expires_at)
WHERE report_token IS NOT NULL AND report_expires_at IS NOT NULL;

-- Comments for new columns
COMMENT ON COLUMN assessments.report_token IS 'Unique token for candidate to access their report (public URL)';
COMMENT ON COLUMN assessments.report_shared_at IS 'Timestamp when report link was shared';
COMMENT ON COLUMN assessments.report_expires_at IS 'Report link expiration (90 days from share date)';
COMMENT ON COLUMN assessments.report_viewed_at IS 'Timestamp when candidate first viewed the report';
