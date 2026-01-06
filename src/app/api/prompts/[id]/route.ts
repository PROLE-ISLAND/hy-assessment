// =====================================================
// Prompt Template API - Single Resource
// GET /api/prompts/:id - Get prompt details
// PUT /api/prompts/:id - Update prompt (creates new version)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { PromptTemplate } from '@/types/database';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Increment semantic version
 * v1.0.0 -> v1.0.1 (patch)
 * v1.0.9 -> v1.1.0 (minor when patch > 9)
 */
function incrementVersion(version: string): string {
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    return 'v1.0.1'; // Fallback
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
 * GET /api/prompts/:id
 * Get prompt details
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const adminSupabase = createAdminClient();

    const { data: prompt, error } = await adminSupabase
      .from('prompt_templates')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single<PromptTemplate>();

    if (error || !prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(prompt);
  } catch (error) {
    console.error('Prompt GET error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/prompts/:id
 * Update prompt and create new version
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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
    const { data: currentPrompt, error: fetchError } = await adminSupabase
      .from('prompt_templates')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single<PromptTemplate>();

    if (fetchError || !currentPrompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      );
    }

    // Check if user can edit (org-specific prompts only)
    if (currentPrompt.organization_id !== dbUser.organization_id) {
      return NextResponse.json(
        { error: 'このプロンプトを編集する権限がありません' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      description,
      content,
      model,
      temperature,
      max_tokens,
      changeSummary,
    } = body;

    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { error: 'プロンプト内容は必須です' },
        { status: 400 }
      );
    }

    // Calculate new version
    const newVersion = incrementVersion(currentPrompt.version);

    // Start transaction-like operations

    // 1. Save current version to history (if not already saved)
    const { data: existingVersion } = await adminSupabase
      .from('prompt_versions')
      .select('id')
      .eq('prompt_id', id)
      .eq('version', currentPrompt.version)
      .single();

    if (!existingVersion) {
      // Save current version to history
      await adminSupabase.from('prompt_versions' as 'users').insert({
        prompt_id: id,
        version: currentPrompt.version,
        content: currentPrompt.content,
        model: currentPrompt.model,
        temperature: currentPrompt.temperature,
        max_tokens: currentPrompt.max_tokens,
        change_summary: '前バージョン',
        created_by: currentPrompt.created_by,
      } as never);
    }

    // 2. Update the prompt
    const updateData: Record<string, unknown> = {
      version: newVersion,
      content,
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (model !== undefined) updateData.model = model;
    if (temperature !== undefined) updateData.temperature = temperature;
    if (max_tokens !== undefined) updateData.max_tokens = max_tokens;

    const { data: updatedPrompt, error: updateError } = await adminSupabase
      .from('prompt_templates')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single<PromptTemplate>();

    if (updateError) {
      console.error('Prompt update error:', updateError);
      return NextResponse.json(
        { error: '更新に失敗しました' },
        { status: 500 }
      );
    }

    // 3. Save new version to history
    await adminSupabase.from('prompt_versions' as 'users').insert({
      prompt_id: id,
      version: newVersion,
      content,
      model: updatedPrompt?.model,
      temperature: updatedPrompt?.temperature,
      max_tokens: updatedPrompt?.max_tokens,
      change_summary: changeSummary || null,
      created_by: user.id,
    } as never);

    return NextResponse.json({
      ...updatedPrompt,
      message: 'プロンプトを更新しました',
    });
  } catch (error) {
    console.error('Prompt PUT error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
