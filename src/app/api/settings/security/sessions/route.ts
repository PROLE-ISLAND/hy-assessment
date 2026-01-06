// =====================================================
// Security Sessions API
// GET /api/settings/security/sessions - Get active sessions
// DELETE /api/settings/security/sessions - Terminate all other sessions
// Issue: #134
// =====================================================

import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { SessionListItem, UserSession } from '@/types/database';

// Browser detection helper
function parseBrowser(userAgent: string | null): string {
  if (!userAgent) return '不明';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
  return '不明';
}

// OS detection helper
function parseOS(userAgent: string | null): string {
  if (!userAgent) return '不明';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  return '不明';
}

// Format location from country/city
function formatLocation(country: string | null, city: string | null): string {
  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  if (city) return city;
  return '不明';
}

// Transform database session to API response format
function transformSession(session: UserSession, currentSessionToken: string | null): SessionListItem {
  return {
    id: session.id,
    deviceType: (session.device_type as SessionListItem['deviceType']) || 'unknown',
    browser: session.browser || parseBrowser(session.user_agent),
    os: session.os || parseOS(session.user_agent),
    location: formatLocation(session.country, session.city),
    lastActiveAt: session.last_active_at,
    isCurrent: session.session_token === currentSessionToken,
  };
}

// GET: Retrieve active sessions for the authenticated user
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      );
    }

    // Get current session token
    const { data: { session } } = await supabase.auth.getSession();
    const currentSessionToken = session?.access_token || null;

    // Fetch active sessions from database
    const { data: sessions, error: fetchError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('last_active_at', { ascending: false });

    if (fetchError) {
      console.error('Failed to fetch sessions:', fetchError);
      return NextResponse.json(
        { error: 'セッション情報の取得に失敗しました' },
        { status: 500 }
      );
    }

    // Transform to API response format
    const sessionList: SessionListItem[] = (sessions || []).map((s) =>
      transformSession(s as UserSession, currentSessionToken)
    );

    return NextResponse.json({
      sessions: sessionList,
      total: sessionList.length,
    });
  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// DELETE: Terminate all other sessions (except current)
export async function DELETE() {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      );
    }

    // Get current session token
    const { data: { session } } = await supabase.auth.getSession();
    const currentSessionToken = session?.access_token || null;

    if (!currentSessionToken) {
      return NextResponse.json(
        { error: '現在のセッションが見つかりません' },
        { status: 400 }
      );
    }

    // Count sessions to delete first
    const { count: sessionsToDelete } = await adminSupabase
      .from('user_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .neq('session_token', currentSessionToken);

    // Delete all sessions except current (using admin client to bypass RLS for bulk delete)
    const { error: deleteError } = await adminSupabase
      .from('user_sessions')
      .delete()
      .eq('user_id', user.id)
      .neq('session_token', currentSessionToken);

    const count = sessionsToDelete;

    if (deleteError) {
      console.error('Failed to delete sessions:', deleteError);
      return NextResponse.json(
        { error: 'セッションの終了に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      terminatedCount: count || 0,
      message: `${count || 0}件のセッションを終了しました`,
    });
  } catch (error) {
    console.error('Sessions DELETE API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
