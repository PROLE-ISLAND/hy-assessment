// =====================================================
// Anonymous Candidate Register API (Issue #215)
// POST /api/candidates/register
// Creates a candidate and assessment for direct flow
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { validateAnonymousCandidateRegister } from '@/lib/validations/candidate';
import { randomUUID } from 'crypto';

interface RegisterResponse {
  id: string;
  token: string;
}

interface ErrorResponse {
  error: string;
  details?: Record<string, string[]>;
}

// Type definitions for database rows
interface OrganizationRow {
  id: string;
}

interface PersonRow {
  id: string;
}

interface CandidateRow {
  id: string;
}

interface TemplateRow {
  id: string;
}

interface AssessmentRow {
  id: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<RegisterResponse | ErrorResponse>> {
  try {
    // Parse and validate request body
    const body: unknown = await request.json();
    const validation = validateAnonymousCandidateRegister(body);

    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of validation.error.issues) {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }
      return NextResponse.json(
        {
          error: validation.error.issues[0]?.message || '入力内容に問題があります',
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, desiredJobType } = validation.data;
    const supabase = createAdminClient();

    // Get default organization (for anonymous candidates)
    // In production, you might want to use a specific organization for anonymous candidates
    const { data: defaultOrg, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single<OrganizationRow>();

    if (orgError || !defaultOrg) {
      console.error('Organization lookup error:', orgError);
      return NextResponse.json(
        { error: 'システムエラーが発生しました' },
        { status: 500 }
      );
    }

    const organizationId = defaultOrg.id;
    const now = new Date().toISOString();

    // Create person record
    const { data: person, error: personError } = await supabase
      .from('persons')
      .insert({
        organization_id: organizationId,
        name: name.trim(),
        email: email.trim(),
        created_at: now,
        updated_at: now,
      } as never)
      .select('id')
      .single<PersonRow>();

    if (personError || !person) {
      console.error('Person creation error:', personError);
      return NextResponse.json(
        { error: '候補者情報の作成に失敗しました' },
        { status: 500 }
      );
    }

    // Create candidate record
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .insert({
        organization_id: organizationId,
        person_id: person.id,
        position: desiredJobType || '',
        desired_positions: desiredJobType ? [desiredJobType] : [],
        notes: null,
        created_at: now,
        updated_at: now,
      } as never)
      .select('id')
      .single<CandidateRow>();

    if (candidateError || !candidate) {
      console.error('Candidate creation error:', candidateError);
      // Rollback: delete person
      await supabase.from('persons').delete().eq('id', person.id);
      return NextResponse.json(
        { error: '候補者情報の作成に失敗しました' },
        { status: 500 }
      );
    }

    // Get default assessment template
    const { data: template, error: templateError } = await supabase
      .from('assessment_templates')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single<TemplateRow>();

    if (templateError || !template) {
      console.error('Template lookup error:', templateError);
      // Rollback: delete candidate and person
      await supabase.from('candidates').delete().eq('id', candidate.id);
      await supabase.from('persons').delete().eq('id', person.id);
      return NextResponse.json(
        { error: '検査テンプレートが見つかりません' },
        { status: 500 }
      );
    }

    // Generate unique token for assessment
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

    // Create assessment record
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        organization_id: organizationId,
        candidate_id: candidate.id,
        template_id: template.id,
        token,
        status: 'pending',
        progress: {},
        expires_at: expiresAt.toISOString(),
        created_at: now,
        updated_at: now,
      } as never)
      .select('id')
      .single<AssessmentRow>();

    if (assessmentError || !assessment) {
      console.error('Assessment creation error:', assessmentError);
      // Rollback: delete candidate and person
      await supabase.from('candidates').delete().eq('id', candidate.id);
      await supabase.from('persons').delete().eq('id', person.id);
      return NextResponse.json(
        { error: '検査の作成に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: candidate.id,
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Candidate register error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
