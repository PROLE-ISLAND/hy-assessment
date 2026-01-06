// =====================================================
// Prompt Versions API
// GET /api/prompts/:id/versions - Get version history
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { PromptVersion } from '@/types/database';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface PromptVersionWithUser extends PromptVersion {
  users: { email: string; name: string } | null;
}

/**
 * GET /api/prompts/:id/versions
 * Get version history for a prompt
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const adminSupabase = createAdminClient();

    // Check if prompt exists
    const { data: prompt, error: promptError } = await adminSupabase
      .from('prompt_templates')
      .select('id, organization_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (promptError || !prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      );
    }

    // Get version history with user info
    const { data: versions, error: versionsError } = await adminSupabase
      .from('prompt_versions')
      .select(
        `
        *,
        users:created_by (
          email,
          name
        )
      `
      )
      .eq('prompt_id', id)
      .order('created_at', { ascending: false })
      .returns<PromptVersionWithUser[]>();

    if (versionsError) {
      console.error('Versions fetch error:', versionsError);
      return NextResponse.json(
        { error: 'バージョン履歴の取得に失敗しました' },
        { status: 500 }
      );
    }

    // Transform to expected format
    const formattedVersions = (versions || []).map((v) => ({
      id: v.id,
      version: v.version,
      content: v.content,
      model: v.model,
      temperature: v.temperature,
      max_tokens: v.max_tokens,
      changeSummary: v.change_summary,
      createdBy: v.users
        ? { email: v.users.email, name: v.users.name }
        : null,
      createdAt: v.created_at,
    }));

    return NextResponse.json({ versions: formattedVersions });
  } catch (error) {
    console.error('Versions API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
