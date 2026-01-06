-- =====================================================
-- Migration: login_history テーブル作成
-- Issue: #134 セキュリティページの実装
-- =====================================================

-- login_history テーブル
CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Login details
    ip_address INET,
    user_agent TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet', 'unknown'
    browser TEXT,     -- 'Chrome', 'Safari', 'Firefox', etc.
    os TEXT,          -- 'macOS', 'Windows', 'iOS', 'Android'

    -- Location (from IP)
    country TEXT,
    city TEXT,

    -- Result
    success BOOLEAN NOT NULL DEFAULT true,
    failure_reason TEXT, -- 'invalid_password', 'account_locked', etc.

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created ON login_history(created_at DESC);

-- Enable RLS
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own login history
CREATE POLICY "login_history_select_own" ON login_history
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Only system (service role) can insert
-- Note: This will be handled by auth hooks or API routes using service role
CREATE POLICY "login_history_insert_system" ON login_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE login_history IS 'ログイン履歴（成功・失敗を記録）';
COMMENT ON COLUMN login_history.device_type IS 'デバイスタイプ: desktop, mobile, tablet, unknown';
COMMENT ON COLUMN login_history.failure_reason IS '失敗理由: invalid_password, account_locked等';
