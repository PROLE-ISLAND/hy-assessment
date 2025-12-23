// =====================================================
// Analysis History API
// GET /api/analysis/[assessmentId]/history
// Returns all analysis versions for an assessment
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { AIAnalysis } from '@/types/database';

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
      console.error('Fetch history error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analysis history' },
        { status: 500 }
      );
    }

    if (!analyses || analyses.length === 0) {
      return NextResponse.json(
        { error: 'No analysis found for this assessment' },
        { status: 404 }
      );
    }

    // Calculate overall score for each version
    const historyWithOverallScore = analyses.map((analysis) => {
      const scores = analysis.scores || {};
      const scoreValues = Object.values(scores).filter(
        (v): v is number => typeof v === 'number'
      );
      const overallScore =
        scoreValues.length > 0
          ? Math.round(
              scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
            )
          : 0;

      return {
        ...analysis,
        overallScore,
      };
    });

    return NextResponse.json({
      assessmentId,
      totalVersions: analyses.length,
      history: historyWithOverallScore,
    });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
