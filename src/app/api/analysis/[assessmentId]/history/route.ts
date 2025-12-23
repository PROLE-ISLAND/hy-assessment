// =====================================================
// Analysis History API
// GET /api/analysis/[assessmentId]/history
// Returns all analysis versions for an assessment
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { calculateOverallScore } from '@/lib/analysis/judgment';

// History item type (subset of AIAnalysis)
interface AnalysisHistoryItem {
  id: string;
  version: number;
  is_latest: boolean;
  model_version: string;
  prompt_version: string;
  tokens_used: number;
  analyzed_at: string;
  created_at: string;
  // Summary scores for quick reference
  scores: Record<string, number>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;

    // Validate assessmentId format (UUID)
    if (!assessmentId || !/^[0-9a-f-]{36}$/i.test(assessmentId)) {
      console.warn(`[History API] Invalid assessmentId: ${assessmentId}`);
      return NextResponse.json(
        { error: 'Invalid assessment ID format' },
        { status: 400 }
      );
    }

    console.log(`[History API] Fetching history for assessment: ${assessmentId}`);
    const supabase = createAdminClient();

    // Get all analysis versions for this assessment
    const { data: analyses, error } = await supabase
      .from('ai_analyses')
      .select(`
        id,
        version,
        is_latest,
        model_version,
        prompt_version,
        tokens_used,
        scores,
        analyzed_at,
        created_at
      `)
      .eq('assessment_id', assessmentId)
      .order('version', { ascending: false })
      .returns<AnalysisHistoryItem[]>();

    if (error) {
      console.error(`[History API] Database error for ${assessmentId}:`, error.message, error.code);
      return NextResponse.json(
        { error: 'Failed to fetch analysis history', details: error.message },
        { status: 500 }
      );
    }

    // Return empty array if no history (not 404 - client expects array)
    if (!analyses || analyses.length === 0) {
      console.log(`[History API] No analysis found for ${assessmentId}`);
      return NextResponse.json({
        assessmentId,
        totalVersions: 0,
        history: [],
      });
    }

    // Calculate overall score for each version (5 domains, excluding VALID)
    const historyWithOverallScore = analyses.map((analysis) => ({
      ...analysis,
      overallScore: calculateOverallScore(analysis.scores || {}),
    }));

    console.log(`[History API] Found ${analyses.length} versions for ${assessmentId}`);
    return NextResponse.json({
      assessmentId,
      totalVersions: analyses.length,
      history: historyWithOverallScore,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[History API] Unexpected error:', errorMessage);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
