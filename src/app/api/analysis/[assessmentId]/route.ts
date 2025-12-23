// =====================================================
// AI Analysis API Endpoint
// POST /api/analysis/[assessmentId]
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { type ResponseData } from '@/lib/analysis';
import {
  analyzeAssessment,
  analyzeAssessmentMock,
} from '@/lib/analysis/ai-analyzer';
import type { Assessment, Candidate, Person, AIAnalysis } from '@/types/database';

// Use mock in development if OPENAI_API_KEY is not set
const USE_MOCK = !process.env.OPENAI_API_KEY;

// Type for assessment with joined data
interface AssessmentWithCandidate extends Assessment {
  candidates: Candidate & {
    persons: Person;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;
    const supabase = createAdminClient();

    // 1. Get assessment with candidate info
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        *,
        candidates!inner (
          *,
          persons!inner (*)
        )
      `)
      .eq('id', assessmentId)
      .is('deleted_at', null)
      .single<AssessmentWithCandidate>();

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // 2. Check if assessment is completed
    if (assessment.status !== 'completed') {
      return NextResponse.json(
        { error: 'Assessment is not completed yet' },
        { status: 400 }
      );
    }

    // 3. Check if already analyzed
    const { data: existingAnalysis } = await supabase
      .from('ai_analyses')
      .select('id')
      .eq('assessment_id', assessmentId)
      .eq('is_latest', true)
      .single<{ id: string }>();

    if (existingAnalysis) {
      return NextResponse.json(
        { error: 'Assessment already analyzed. Use PUT to re-analyze.' },
        { status: 409 }
      );
    }

    // 4. Get responses
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('question_id, answer')
      .eq('assessment_id', assessmentId)
      .returns<ResponseData[]>();

    if (responsesError || !responses || responses.length === 0) {
      return NextResponse.json(
        { error: 'No responses found for this assessment' },
        { status: 400 }
      );
    }

    // 5. Extract candidate position from joined data
    const candidatePosition = assessment.candidates?.position || '不明';

    // 6. Run analysis (mock or real)
    const analysisInput = {
      responses,
      candidatePosition,
    };

    const analysisResult = USE_MOCK
      ? await analyzeAssessmentMock(analysisInput)
      : await analyzeAssessment(analysisInput);

    // 7. Save to database
    const insertData: Omit<AIAnalysis, 'id' | 'created_at'> = {
      assessment_id: assessmentId,
      organization_id: assessment.organization_id,
      scores: Object.fromEntries(
        Object.entries(analysisResult.scoringResult.domainScores).map(
          ([key, score]) => [key, score.percentage]
        )
      ),
      strengths: analysisResult.aiAnalysis.strengths,
      weaknesses: analysisResult.aiAnalysis.weaknesses,
      summary: analysisResult.aiAnalysis.summary,
      recommendation: analysisResult.aiAnalysis.recommendation,
      model_version: analysisResult.modelVersion,
      prompt_version: analysisResult.promptVersion,
      tokens_used: analysisResult.tokensUsed,
      version: 1,
      is_latest: true,
      analyzed_at: new Date().toISOString(),
    };

    const { data: savedAnalysis, error: saveError } = await supabase
      .from('ai_analyses')
      .insert(insertData as never)
      .select('id')
      .single<{ id: string }>();

    if (saveError) {
      console.error('Save analysis error:', saveError);
      return NextResponse.json(
        { error: 'Failed to save analysis' },
        { status: 500 }
      );
    }

    // 8. Return result
    return NextResponse.json({
      success: true,
      analysisId: savedAnalysis?.id,
      scores: {
        GOV: analysisResult.scoringResult.domainScores.GOV.percentage,
        CONFLICT: analysisResult.scoringResult.domainScores.CONFLICT.percentage,
        REL: analysisResult.scoringResult.domainScores.REL.percentage,
        COG: analysisResult.scoringResult.domainScores.COG.percentage,
        WORK: analysisResult.scoringResult.domainScores.WORK.percentage,
        VALID: analysisResult.scoringResult.domainScores.VALID.percentage,
      },
      overallScore: analysisResult.scoringResult.overallScore,
      strengths: analysisResult.aiAnalysis.strengths,
      weaknesses: analysisResult.aiAnalysis.weaknesses,
      summary: analysisResult.aiAnalysis.summary,
      recommendation: analysisResult.aiAnalysis.recommendation,
      validityFlags: analysisResult.scoringResult.validityFlags,
      modelVersion: analysisResult.modelVersion,
      promptVersion: analysisResult.promptVersion,
      tokensUsed: analysisResult.tokensUsed,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT endpoint for re-analysis
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;
    const supabase = createAdminClient();

    // Mark existing analyses as not latest
    await supabase
      .from('ai_analyses')
      .update({ is_latest: false } as never)
      .eq('assessment_id', assessmentId);

    // Get assessment with candidate
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        *,
        candidates!inner (
          position
        )
      `)
      .eq('id', assessmentId)
      .is('deleted_at', null)
      .single<Assessment & { candidates: { position: string } }>();

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    if (assessment.status !== 'completed') {
      return NextResponse.json(
        { error: 'Assessment is not completed yet' },
        { status: 400 }
      );
    }

    // Get responses
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('question_id, answer')
      .eq('assessment_id', assessmentId)
      .returns<ResponseData[]>();

    if (responsesError || !responses || responses.length === 0) {
      return NextResponse.json(
        { error: 'No responses found' },
        { status: 400 }
      );
    }

    // Get current version number
    const { data: latestVersion } = await supabase
      .from('ai_analyses')
      .select('version')
      .eq('assessment_id', assessmentId)
      .order('version', { ascending: false })
      .limit(1)
      .single<{ version: number }>();

    const newVersion = (latestVersion?.version || 0) + 1;

    // Run analysis
    const analysisInput = {
      responses,
      candidatePosition: assessment.candidates?.position || '不明',
    };

    const analysisResult = USE_MOCK
      ? await analyzeAssessmentMock(analysisInput)
      : await analyzeAssessment(analysisInput);

    // Save new analysis
    const insertData: Omit<AIAnalysis, 'id' | 'created_at'> = {
      assessment_id: assessmentId,
      organization_id: assessment.organization_id,
      scores: Object.fromEntries(
        Object.entries(analysisResult.scoringResult.domainScores).map(
          ([key, score]) => [key, score.percentage]
        )
      ),
      strengths: analysisResult.aiAnalysis.strengths,
      weaknesses: analysisResult.aiAnalysis.weaknesses,
      summary: analysisResult.aiAnalysis.summary,
      recommendation: analysisResult.aiAnalysis.recommendation,
      model_version: analysisResult.modelVersion,
      prompt_version: analysisResult.promptVersion,
      tokens_used: analysisResult.tokensUsed,
      version: newVersion,
      is_latest: true,
      analyzed_at: new Date().toISOString(),
    };

    const { data: savedAnalysis, error: saveError } = await supabase
      .from('ai_analyses')
      .insert(insertData as never)
      .select('id')
      .single<{ id: string }>();

    if (saveError) {
      console.error('Save analysis error:', saveError);
      return NextResponse.json(
        { error: 'Failed to save analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysisId: savedAnalysis?.id,
      version: newVersion,
      scores: {
        GOV: analysisResult.scoringResult.domainScores.GOV.percentage,
        CONFLICT: analysisResult.scoringResult.domainScores.CONFLICT.percentage,
        REL: analysisResult.scoringResult.domainScores.REL.percentage,
        COG: analysisResult.scoringResult.domainScores.COG.percentage,
        WORK: analysisResult.scoringResult.domainScores.WORK.percentage,
        VALID: analysisResult.scoringResult.domainScores.VALID.percentage,
      },
      overallScore: analysisResult.scoringResult.overallScore,
      strengths: analysisResult.aiAnalysis.strengths,
      weaknesses: analysisResult.aiAnalysis.weaknesses,
      summary: analysisResult.aiAnalysis.summary,
      recommendation: analysisResult.aiAnalysis.recommendation,
      validityFlags: analysisResult.scoringResult.validityFlags,
    });
  } catch (error) {
    console.error('Re-analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve existing analysis
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;
    const supabase = createAdminClient();

    const { data: analysis, error } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('is_latest', true)
      .single<AIAnalysis>();

    if (error || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Get analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
