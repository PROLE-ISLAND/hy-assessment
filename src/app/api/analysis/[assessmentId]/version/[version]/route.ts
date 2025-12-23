// =====================================================
// Analysis Version API
// GET /api/analysis/[assessmentId]/version/[version]
// Returns a specific version of analysis
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { calculateOverallScore } from '@/lib/analysis/judgment';
import type { AIAnalysis } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string; version: string }> }
) {
  try {
    const { assessmentId, version } = await params;
    const versionNumber = parseInt(version, 10);

    if (isNaN(versionNumber) || versionNumber < 1) {
      return NextResponse.json(
        { error: 'Invalid version number' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get specific version
    const { data: analysis, error } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('version', versionNumber)
      .single<AIAnalysis>();

    if (error || !analysis) {
      return NextResponse.json(
        { error: `Version ${versionNumber} not found` },
        { status: 404 }
      );
    }

    // Calculate overall score (5 domains, excluding VALID)
    return NextResponse.json({
      ...analysis,
      overallScore: calculateOverallScore(analysis.scores || {}),
    });
  } catch (error) {
    console.error('Get version error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
