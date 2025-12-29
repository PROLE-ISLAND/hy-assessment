// =====================================================
// Profile Settings API
// PUT /api/settings/profile - Update user profile
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

interface UpdateProfileBody {
  name: string;
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: UpdateProfileBody = await request.json();
    const { name } = body;

    // Validate
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: '名前を入力してください' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: '名前は100文字以内で入力してください' },
        { status: 400 }
      );
    }

    // Update user profile
    const { error: updateError } = await adminSupabase
      .from('users')
      .update({ name: name.trim() } as never)
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'プロフィールの更新に失敗しました' },
        { status: 500 }
      );
    }

    // Also update the person record if exists
    const { data: userData } = await adminSupabase
      .from('users')
      .select('person_id')
      .eq('id', user.id)
      .single<{ person_id: string | null }>();

    if (userData?.person_id) {
      await adminSupabase
        .from('persons')
        .update({ name: name.trim() } as never)
        .eq('id', userData.person_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile settings error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
