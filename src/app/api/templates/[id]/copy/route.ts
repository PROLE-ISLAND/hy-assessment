// =====================================================
// Template Copy API
// POST /api/templates/[id]/copy
// Creates a new version by copying existing template
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

interface CopyRequest {
  version: string;
}

interface TemplateRow {
  id: string;
  organization_id: string;
  type_id: string;
  name: string;
  version: string;
  questions: Record<string, unknown>;
  is_active: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: CopyRequest = await request.json();
    const { version } = body;

    if (!version?.trim()) {
      return NextResponse.json(
        { error: 'バージョン番号は必須です' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: dbUser } = await adminSupabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single<{ organization_id: string }>();

    if (!dbUser?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get original template
    const { data: original, error: fetchError } = await adminSupabase
      .from('assessment_templates')
      .select('id, organization_id, type_id, name, version, questions, is_active')
      .eq('id', id)
      .eq('organization_id', dbUser.organization_id)
      .is('deleted_at', null)
      .single<TemplateRow>();

    if (fetchError || !original) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if version already exists for this template name
    const { data: existing } = await adminSupabase
      .from('assessment_templates')
      .select('id')
      .eq('organization_id', dbUser.organization_id)
      .eq('name', original.name)
      .eq('version', version.trim())
      .is('deleted_at', null)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'このバージョン番号は既に存在します' },
        { status: 400 }
      );
    }

    // Create new template copy
    interface NewTemplateInsert {
      organization_id: string;
      type_id: string;
      name: string;
      version: string;
      questions: Record<string, unknown>;
      is_active: boolean;
    }

    const newTemplate: NewTemplateInsert = {
      organization_id: original.organization_id,
      type_id: original.type_id,
      name: original.name,
      version: version.trim(),
      questions: original.questions,
      is_active: false, // New versions start as inactive
    };

    const { data: created, error: createError } = await adminSupabase
      .from('assessment_templates')
      .insert(newTemplate as never)
      .select('id')
      .single<{ id: string }>();

    if (createError || !created) {
      console.error('Create error:', createError);
      return NextResponse.json(
        { error: 'Failed to create new version' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: created.id,
      version: version.trim(),
    });
  } catch (error) {
    console.error('Copy API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
