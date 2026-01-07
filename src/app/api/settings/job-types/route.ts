// =====================================================
// Job Types API (Issue #192)
// GET /api/settings/job-types - 職種一覧取得
// POST /api/settings/job-types - 職種新規作成
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { jobTypeCreateSchema, jobTypeListQuerySchema } from '@/lib/validations/job-types';
import type { JobType } from '@/types/database';

/**
 * 職種一覧取得
 * GET /api/settings/job-types
 */
export async function GET(request: NextRequest) {
  try {
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

    // ユーザーの組織情報取得
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

    // クエリパラメータ解析
    const searchParams = request.nextUrl.searchParams;
    const queryResult = jobTypeListQuerySchema.safeParse({
      includeInactive: searchParams.get('includeInactive'),
    });

    const includeInactive = queryResult.success ? queryResult.data.includeInactive : false;

    // 職種一覧取得（RLSで自動的に組織フィルタリング）
    let query = supabase
      .from('job_types')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: jobTypes, error: jobTypesError } = await query;

    if (jobTypesError) {
      console.error('Job types fetch error:', jobTypesError);
      return NextResponse.json(
        { error: 'fetch_failed', message: '職種一覧の取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobTypes: jobTypes || [] });
  } catch (error) {
    console.error('Job types GET error:', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * 職種新規作成
 * POST /api/settings/job-types
 */
export async function POST(request: NextRequest) {
  try {
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

    // リクエストボディのパース・バリデーション
    const body = await request.json();
    const parseResult = jobTypeCreateSchema.safeParse(body);

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

    // 重複チェック（同一組織内で同名の職種）
    const { data: existingJobType } = await supabase
      .from('job_types')
      .select('id')
      .eq('organization_id', userData.organization_id)
      .eq('name', input.name)
      .is('deleted_at', null)
      .single();

    if (existingJobType) {
      return NextResponse.json(
        { error: 'conflict', message: '同名の職種が既に存在します' },
        { status: 409 }
      );
    }

    // 職種作成
    // Note: 型アサーションは新テーブル追加時にSupabase型が未生成のため必要
    const { data: jobType, error: createError } = await supabase
      .from('job_types' as 'users') // 型アサーション（新テーブル）
      .insert({
        organization_id: userData.organization_id,
        ...input,
      } as never)
      .select()
      .single<JobType>();

    if (createError) {
      console.error('Job type create error:', createError);
      return NextResponse.json(
        { error: 'create_failed', message: '職種の作成に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobType }, { status: 201 });
  } catch (error) {
    console.error('Job types POST error:', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
