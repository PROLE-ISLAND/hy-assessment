// =====================================================
// Candidate Info API
// POST /api/assessment/[token]/candidate-info
// Saves candidate information before assessment starts
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface CandidateInfoRequest {
  name: string;
  email: string;
  desiredPositions: string[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body: CandidateInfoRequest = await request.json();
    const { name, email, desiredPositions } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'お名前は必須です' },
        { status: 400 }
      );
    }
    if (!email?.trim()) {
      return NextResponse.json(
        { error: 'メールアドレスは必須です' },
        { status: 400 }
      );
    }
    if (!desiredPositions?.length) {
      return NextResponse.json(
        { error: '希望職種を選択してください' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Type for assessment query
    interface AssessmentRow {
      id: string;
      organization_id: string;
      candidate_id: string;
    }

    // Get assessment by token
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, organization_id, candidate_id')
      .eq('token', token)
      .is('deleted_at', null)
      .single<AssessmentRow>();

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: '検査が見つかりません' },
        { status: 404 }
      );
    }

    // Type for candidate query
    interface CandidateRow {
      id: string;
      person_id: string;
    }

    // Get candidate
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('id, person_id')
      .eq('id', assessment.candidate_id)
      .single<CandidateRow>();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: '候補者情報が見つかりません' },
        { status: 404 }
      );
    }

    // Update person info
    const { error: personError } = await supabase
      .from('persons')
      .update({
        name: name.trim(),
        email: email.trim(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', candidate.person_id);

    if (personError) {
      console.error('Person update error:', personError);
      return NextResponse.json(
        { error: '情報の保存に失敗しました' },
        { status: 500 }
      );
    }

    // Update candidate with desired positions
    const { error: candidateUpdateError } = await supabase
      .from('candidates')
      .update({
        desired_positions: desiredPositions,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', candidate.id);

    if (candidateUpdateError) {
      console.error('Candidate update error:', candidateUpdateError);
      return NextResponse.json(
        { error: '情報の保存に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Candidate info error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
