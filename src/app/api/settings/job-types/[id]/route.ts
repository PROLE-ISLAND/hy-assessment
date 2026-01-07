// =====================================================
// Job Types Individual API (Issue #192)
// PUT /api/settings/job-types/:id - 職種更新
// DELETE /api/settings/job-types/:id - 職種削除（論理削除）
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { jobTypeUpdateSchema } from '@/lib/validations/job-types';
import type { JobType } from '@/types/database';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * 職種更新
 * PUT /api/settings/job-types/:id
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザー情報取得（ロールチェック用）
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single<{ organization_id: string; role: string }>();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'user_not_found', message: 'ユーザー情報が見つかりません' },
        { status: 404 }
      );
    }

    // Admin権限チェック
    if (userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'forbidden', message: 'Admin権限が必要です' },
        { status: 403 }
      );
    }

    // 対象職種の存在確認（RLSで組織チェック）
    const { data: existingJobType, error: fetchError } = await supabase
      .from('job_types')
      .select('id, name, organization_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single<{ id: string; name: string; organization_id: string }>();

    if (fetchError || !existingJobType) {
      return NextResponse.json(
        { error: 'not_found', message: '職種が見つかりません' },
        { status: 404 }
      );
    }

    // リクエストボディのパース・バリデーション
    const body = await request.json();
    const parseResult = jobTypeUpdateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'バリデーションエラー',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // 名前変更時は重複チェック
    if (input.name && input.name !== existingJobType.name) {
      const { data: duplicateJobType } = await supabase
        .from('job_types')
        .select('id')
        .eq('organization_id', userData.organization_id)
        .eq('name', input.name)
        .is('deleted_at', null)
        .neq('id', id)
        .single();

      if (duplicateJobType) {
        return NextResponse.json(
          { error: 'conflict', message: '同名の職種が既に存在します' },
          { status: 409 }
        );
      }
    }

    // 更新データがない場合
    if (Object.keys(input).length === 0) {
      return NextResponse.json(
        { error: 'validation_error', message: '更新するデータがありません' },
        { status: 400 }
      );
    }

    // 職種更新
    // Note: 型アサーションは新テーブル追加時にSupabase型が未生成のため必要
    const { data: jobType, error: updateError } = await supabase
      .from('job_types' as 'users')
      .update(input as never)
      .eq('id', id)
      .select()
      .single<JobType>();

    if (updateError) {
      console.error('Job type update error:', updateError);
      return NextResponse.json(
        { error: 'update_failed', message: '職種の更新に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobType });
  } catch (error) {
    console.error('Job types PUT error:', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * 職種削除（論理削除）
 * DELETE /api/settings/job-types/:id
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザー情報取得（ロールチェック用）
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single<{ organization_id: string; role: string }>();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'user_not_found', message: 'ユーザー情報が見つかりません' },
        { status: 404 }
      );
    }

    // Admin権限チェック
    if (userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'forbidden', message: 'Admin権限が必要です' },
        { status: 403 }
      );
    }

    // 対象職種の存在確認（RLSで組織チェック）
    const { data: existingJobType, error: fetchError } = await supabase
      .from('job_types')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingJobType) {
      return NextResponse.json(
        { error: 'not_found', message: '職種が見つかりません' },
        { status: 404 }
      );
    }

    // 論理削除
    // Note: 型アサーションは新テーブル追加時にSupabase型が未生成のため必要
    const { error: deleteError } = await supabase
      .from('job_types' as 'users')
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq('id', id);

    if (deleteError) {
      console.error('Job type delete error:', deleteError);
      return NextResponse.json(
        { error: 'delete_failed', message: '職種の削除に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Job types DELETE error:', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
