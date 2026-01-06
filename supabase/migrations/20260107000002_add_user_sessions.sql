-- =====================================================
-- Migration: user_sessions テーブル作成
-- Issue: #134 セキュリティページの実装
-- =====================================================

-- user_sessions テーブル
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Session info
    session_token TEXT NOT NULL UNIQUE,

    -- Device info
    ip_address INET,
    user_agent TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet', 'unknown'
    browser TEXT,
    os TEXT,

    -- Location
    country TEXT,
    city TEXT,

    -- Status
    is_current BOOLEAN NOT NULL DEFAULT false,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON user_sessions(last_active_at DESC);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own sessions
CREATE POLICY "user_sessions_select_own" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own sessions
CREATE POLICY "user_sessions_delete_own" ON user_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policy: System can insert sessions (via service role)
CREATE POLICY "user_sessions_insert_system" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: System can update sessions (via service role)
CREATE POLICY "user_sessions_update_own" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE user_sessions IS 'アクティブなユーザーセッション';
COMMENT ON COLUMN user_sessions.session_token IS 'Supabase Auth セッショントークン（ハッシュ化推奨）';
COMMENT ON COLUMN user_sessions.is_current IS '現在アクセス中のセッションかどうか';
COMMENT ON COLUMN user_sessions.expires_at IS 'セッション有効期限';
