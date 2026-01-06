// =====================================================
// Security Session (Individual) API
// DELETE /api/settings/security/sessions/[id] - Terminate specific session
// Issue: #134
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE: Terminate a specific session
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Validate session ID
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json(
        { error: 'validation_error', details: { id: '無効なセッションIDです' } },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      );
    }

    // Get current session to prevent self-termination
    const { data: { session } } = await supabase.auth.getSession();
    const currentSessionToken = session?.access_token || null;

    // Check if the session exists and belongs to the user
    const { data: targetSession, error: fetchError } = await supabase
      .from('user_sessions')
      .select('id, session_token, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single<{ id: string; session_token: string; user_id: string }>();

    if (fetchError || !targetSession) {
      return NextResponse.json(
        { error: 'not_found' },
        { status: 404 }
      );
    }

    // Prevent terminating current session via this endpoint
    if (targetSession.session_token === currentSessionToken) {
      return NextResponse.json(
        { error: 'forbidden', details: '現在のセッションは終了できません。ログアウトを使用してください。' },
        { status: 403 }
      );
    }

    // Delete the session (using admin client to ensure deletion)
    const { error: deleteError } = await adminSupabase
      .from('user_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Failed to delete session:', deleteError);
      return NextResponse.json(
        { error: 'セッションの終了に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'セッションを終了しました',
    });
  } catch (error) {
    console.error('Session DELETE API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
