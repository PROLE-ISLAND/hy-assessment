// =====================================================
// Update Assessment Progress API
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface ProgressBody {
  currentPage: number;
  totalPages: number;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body: ProgressBody = await request.json();
    const { currentPage, totalPages } = body;

    const supabase = createAdminClient();

    // Get assessment by token
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, status, progress')
      .eq('token', token)
      .is('deleted_at', null)
      .single<{ id: string; status: string; progress: Record<string, unknown> }>();

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Check if still active
    if (assessment.status !== 'pending' && assessment.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Assessment is not active' },
        { status: 409 }
      );
    }

    // Update progress
    const newProgress = {
      ...assessment.progress,
      currentPage,
      totalPages,
      lastActivityAt: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('assessments')
      .update({ progress: newProgress } as never)
      .eq('id', assessment.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Progress update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
