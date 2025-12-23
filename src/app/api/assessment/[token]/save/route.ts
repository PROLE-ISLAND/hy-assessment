// =====================================================
// Save Assessment Response API
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface SaveResponseBody {
  questionId: string;
  answer: unknown;
  pageNumber: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body: SaveResponseBody = await request.json();
    const { questionId, answer, pageNumber } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: 'questionId is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get assessment by token
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, organization_id, status, expires_at')
      .eq('token', token)
      .is('deleted_at', null)
      .single<{ id: string; organization_id: string; status: string; expires_at: string }>();

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(assessment.expires_at);
    if (now > expiresAt || assessment.status === 'expired') {
      return NextResponse.json(
        { error: 'Assessment has expired' },
        { status: 410 }
      );
    }

    // Check if already completed
    if (assessment.status === 'completed') {
      return NextResponse.json(
        { error: 'Assessment already completed' },
        { status: 409 }
      );
    }

    // Upsert response (update if exists, insert if not)
    const { error: upsertError } = await supabase
      .from('responses')
      .upsert(
        {
          organization_id: assessment.organization_id,
          assessment_id: assessment.id,
          question_id: questionId,
          answer,
          page_number: pageNumber,
          answered_at: new Date().toISOString(),
        } as never,
        {
          onConflict: 'assessment_id,question_id',
        }
      );

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save response error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
