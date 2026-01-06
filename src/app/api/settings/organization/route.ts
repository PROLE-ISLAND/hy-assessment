// =====================================================
// Organization Settings API
// GET /api/settings/organization - Get organization info
// PUT /api/settings/organization - Update organization info
// DELETE /api/settings/organization - Delete organization (admin only)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  updateOrganizationSchema,
  deleteOrganizationSchema,
} from '@/lib/validations/organization';
import {
  OrganizationSettings,
  DEFAULT_ORGANIZATION_SETTINGS,
  OrganizationResponse,
} from '@/types/settings';

/**
 * 組織情報取得
 * GET /api/settings/organization
 */
export async function GET() {
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

    // 組織情報取得
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, settings, created_at')
      .eq('id', userData.organization_id)
      .single<{
        id: string;
        name: string;
        slug: string;
        settings: Record<string, unknown> | null;
        created_at: string;
      }>();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'organization_not_found', message: '組織情報が見つかりません' },
        { status: 404 }
      );
    }

    // 設定がない場合はデフォルト値を使用
    const settings: OrganizationSettings = {
      ...DEFAULT_ORGANIZATION_SETTINGS,
      ...(organization.settings as Partial<OrganizationSettings>),
    };

    const response: OrganizationResponse = {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      settings,
      created_at: organization.created_at,
      userRole: userData.role as 'admin' | 'recruiter' | 'viewer',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Organization settings GET error:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * 組織情報更新
 * PUT /api/settings/organization
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

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

    // admin権限チェック
    if (userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'forbidden', message: 'Admin権限が必要です' },
        { status: 403 }
      );
    }

    // リクエストボディのパース・バリデーション
    const body = await request.json();
    const parseResult = updateOrganizationSchema.safeParse(body);

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

    const { name, settings } = parseResult.data;

    // 現在の組織情報取得
    const { data: currentOrg, error: currentOrgError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', userData.organization_id)
      .single<{ settings: Record<string, unknown> | null }>();

    if (currentOrgError) {
      return NextResponse.json(
        { error: 'organization_not_found', message: '組織情報が見つかりません' },
        { status: 404 }
      );
    }

    // 更新データの構築
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (settings !== undefined) {
      // 既存の設定とマージ
      const currentSettings = {
        ...DEFAULT_ORGANIZATION_SETTINGS,
        ...(currentOrg.settings as Partial<OrganizationSettings>),
      };

      updateData.settings = {
        ...currentSettings,
        assessment: {
          ...currentSettings.assessment,
          ...settings.assessment,
        },
      };
    }

    // 更新がない場合はそのまま返す
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, message: '更新項目がありません' });
    }

    // 組織情報更新
    const { error: updateError } = await adminSupabase
      .from('organizations')
      .update(updateData as never)
      .eq('id', userData.organization_id);

    if (updateError) {
      console.error('Organization update error:', updateError);
      return NextResponse.json(
        { error: 'update_failed', message: '組織情報の更新に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Organization settings PUT error:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * 組織削除
 * DELETE /api/settings/organization
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

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

    // admin権限チェック
    if (userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'forbidden', message: 'Admin権限が必要です' },
        { status: 403 }
      );
    }

    // リクエストボディのパース・バリデーション
    const body = await request.json();
    const parseResult = deleteOrganizationSchema.safeParse(body);

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

    const { confirmationName } = parseResult.data;

    // 組織名の確認
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', userData.organization_id)
      .single<{ id: string; name: string }>();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'organization_not_found', message: '組織情報が見つかりません' },
        { status: 404 }
      );
    }

    // 組織名の一致確認
    if (organization.name !== confirmationName) {
      return NextResponse.json(
        {
          error: 'confirmation_mismatch',
          message: '組織名が一致しません。正確な組織名を入力してください。',
        },
        { status: 400 }
      );
    }

    // 組織削除（ソフトデリート）
    const { error: deleteError } = await adminSupabase
      .from('organizations')
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq('id', userData.organization_id);

    if (deleteError) {
      console.error('Organization delete error:', deleteError);
      return NextResponse.json(
        { error: 'delete_failed', message: '組織の削除に失敗しました' },
        { status: 500 }
      );
    }

    // ユーザーのセッションを無効化
    await supabase.auth.signOut();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Organization settings DELETE error:', error);
    return NextResponse.json(
      { error: 'server_error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
