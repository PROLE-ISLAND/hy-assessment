// =====================================================
// Prompt Version Revert API
// POST /api/prompts/:id/versions/:version/revert - Revert to version
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { PromptTemplate, PromptVersion } from '@/types/database';

interface RouteContext {
  params: Promise<{ id: string; version: string }>;
}

/**
 * Increment semantic version
 */
function incrementVersion(version: string): string {
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    return 'v1.0.1';
  }

  let [, major, minor, patch] = match.map(Number);

  patch++;
  if (patch > 9) {
    patch = 0;
    minor++;
    if (minor > 9) {
      minor = 0;
      major++;
    }
  }

  return `v${major}.${minor}.${patch}`;
}

/**
 * POST /api/prompts/:id/versions/:version/revert
 * Revert prompt to a previous version
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id, version } = await context.params;
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // Get user's organization
    const { data: dbUser } = await adminSupabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single<{ organization_id: string }>();

    if (!dbUser) {
      return NextResponse.json(
        { error: 'ユーザー情報が見つかりません' },
        { status: 403 }
      );
    }

    // Get current prompt
    const { data: currentPrompt, error: promptError } = await adminSupabase
      .from('prompt_templates')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single<PromptTemplate>();

    if (promptError || !currentPrompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      );
    }

    // Check if user can edit
    if (currentPrompt.organization_id !== dbUser.organization_id) {
      return NextResponse.json(
        { error: 'このプロンプトを編集する権限がありません' },
        { status: 403 }
      );
    }

    // Get target version
    const decodedVersion = decodeURIComponent(version);
    const { data: targetVersion, error: versionError } = await adminSupabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_id', id)
      .eq('version', decodedVersion)
      .single<PromptVersion>();

    if (versionError || !targetVersion) {
      return NextResponse.json(
        { error: '指定されたバージョンが見つかりません' },
        { status: 404 }
      );
    }

    // Calculate new version number
    const newVersion = incrementVersion(currentPrompt.version);

    // Save current version to history first
    const { data: existingVersion } = await adminSupabase
      .from('prompt_versions')
      .select('id')
      .eq('prompt_id', id)
      .eq('version', currentPrompt.version)
      .single();

    if (!existingVersion) {
      await adminSupabase.from('prompt_versions' as 'users').insert({
        prompt_id: id,
        version: currentPrompt.version,
        content: currentPrompt.content,
        model: currentPrompt.model,
        temperature: currentPrompt.temperature,
        max_tokens: currentPrompt.max_tokens,
        change_summary: '復元前のバージョン',
        created_by: user.id,
      } as never);
    }

    // Update prompt with target version content
    const { data: updatedPrompt, error: updateError } = await adminSupabase
      .from('prompt_templates')
      .update({
        version: newVersion,
        content: targetVersion.content,
        model: targetVersion.model || currentPrompt.model,
        temperature: targetVersion.temperature ?? currentPrompt.temperature,
        max_tokens: targetVersion.max_tokens ?? currentPrompt.max_tokens,
      } as never)
      .eq('id', id)
      .select()
      .single<PromptTemplate>();

    if (updateError) {
      console.error('Revert update error:', updateError);
      return NextResponse.json({ error: '復元に失敗しました' }, { status: 500 });
    }

    // Save new version to history
    await adminSupabase.from('prompt_versions' as 'users').insert({
      prompt_id: id,
      version: newVersion,
      content: targetVersion.content,
      model: updatedPrompt?.model,
      temperature: updatedPrompt?.temperature,
      max_tokens: updatedPrompt?.max_tokens,
      change_summary: `${decodedVersion} から復元`,
      created_by: user.id,
    } as never);

    return NextResponse.json({
      ...updatedPrompt,
      message: `${decodedVersion} から復元しました`,
      revertedFrom: decodedVersion,
    });
  } catch (error) {
    console.error('Revert API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
