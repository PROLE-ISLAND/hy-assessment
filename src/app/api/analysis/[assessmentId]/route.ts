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
  analyzeAssessmentFull,
  analyzeAssessmentFullMock,
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

    // 6. Run v2 analysis (mock or real)
    const analysisInput = {
      responses,
      candidatePosition,
      organizationId: assessment.organization_id,
    };

    // Use v2 full analysis by default
    const analysisResult = USE_MOCK
      ? await analyzeAssessmentFullMock(analysisInput)
      : await analyzeAssessmentFull(analysisInput);

    // Extract v2 fields (always available in full analysis)
    const { internalReport, candidateReport } = analysisResult;

    // Build legacy fields from v2 for backward compatibility
    const legacyStrengths = internalReport.strengths.map((s) => s.behavior);
    const legacyWeaknesses = internalReport.watchouts.map((w) => w.risk);

    // 7. Save to database
    const insertData: Omit<AIAnalysis, 'id' | 'created_at'> = {
      assessment_id: assessmentId,
      organization_id: assessment.organization_id,
      scores: Object.fromEntries(
        Object.entries(analysisResult.scoringResult.domainScores).map(
          ([key, score]) => [key, score.percentage]
        )
      ),
      // Legacy fields (for backward compatibility)
      strengths: legacyStrengths,
      weaknesses: legacyWeaknesses,
      summary: internalReport.summary,
      recommendation: internalReport.recommendation,
      model_version: analysisResult.modelVersion,
      prompt_version: analysisResult.promptVersion,
      tokens_used: analysisResult.totalTokensUsed,
      version: 1,
      is_latest: true,
      analyzed_at: new Date().toISOString(),
      // v2 enhanced fields
      enhanced_strengths: internalReport.strengths,
      enhanced_watchouts: internalReport.watchouts,
      risk_scenarios: internalReport.risk_scenarios,
      interview_checks: internalReport.interview_checks,
      candidate_report: candidateReport,
      report_version: 'v2',
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
      // v2 enhanced fields
      strengths: internalReport.strengths,
      watchouts: internalReport.watchouts,
      risk_scenarios: internalReport.risk_scenarios,
      interview_checks: internalReport.interview_checks,
      summary: internalReport.summary,
      recommendation: internalReport.recommendation,
      candidateReport: candidateReport,
      // Legacy fields for backward compatibility
      weaknesses: legacyWeaknesses,
      validityFlags: analysisResult.scoringResult.validityFlags,
      modelVersion: analysisResult.modelVersion,
      promptVersion: analysisResult.promptVersion,
      tokensUsed: analysisResult.totalTokensUsed,
      reportVersion: 'v2',
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Request body type for re-analysis
interface ReanalyzeRequest {
  promptTemplateId?: string; // Optional: use specific prompt template
  model?: string; // Optional: override model
}

// PUT endpoint for re-analysis
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;
    const supabase = createAdminClient();

    // Parse request body for optional parameters
    let reanalyzeOptions: ReanalyzeRequest = {};
    try {
      const body = await request.json();
      reanalyzeOptions = {
        promptTemplateId: body.promptTemplateId,
        model: body.model,
      };
    } catch {
      // Empty body is fine, use defaults
    }

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

    // Run v2 analysis with optional prompt/model overrides
    const analysisInput = {
      responses,
      candidatePosition: assessment.candidates?.position || '不明',
      organizationId: assessment.organization_id,
      promptTemplateId: reanalyzeOptions.promptTemplateId,
      modelOverride: reanalyzeOptions.model,
    };

    // Use v2 full analysis by default
    const analysisResult = USE_MOCK
      ? await analyzeAssessmentFullMock(analysisInput)
      : await analyzeAssessmentFull(analysisInput);

    // Extract v2 fields (always available in full analysis)
    const { internalReport, candidateReport } = analysisResult;

    // Build legacy fields from v2 for backward compatibility
    const legacyStrengths = internalReport.strengths.map((s) => s.behavior);
    const legacyWeaknesses = internalReport.watchouts.map((w) => w.risk);

    // Save new analysis
    const insertData: Omit<AIAnalysis, 'id' | 'created_at'> = {
      assessment_id: assessmentId,
      organization_id: assessment.organization_id,
      scores: Object.fromEntries(
        Object.entries(analysisResult.scoringResult.domainScores).map(
          ([key, score]) => [key, score.percentage]
        )
      ),
      // Legacy fields (for backward compatibility)
      strengths: legacyStrengths,
      weaknesses: legacyWeaknesses,
      summary: internalReport.summary,
      recommendation: internalReport.recommendation,
      model_version: analysisResult.modelVersion,
      prompt_version: analysisResult.promptVersion,
      tokens_used: analysisResult.totalTokensUsed,
      version: newVersion,
      is_latest: true,
      analyzed_at: new Date().toISOString(),
      // v2 enhanced fields
      enhanced_strengths: internalReport.strengths,
      enhanced_watchouts: internalReport.watchouts,
      risk_scenarios: internalReport.risk_scenarios,
      interview_checks: internalReport.interview_checks,
      candidate_report: candidateReport,
      report_version: 'v2',
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
      // v2 enhanced fields
      strengths: internalReport.strengths,
      watchouts: internalReport.watchouts,
      risk_scenarios: internalReport.risk_scenarios,
      interview_checks: internalReport.interview_checks,
      summary: internalReport.summary,
      recommendation: internalReport.recommendation,
      candidateReport: candidateReport,
      // Legacy fields for backward compatibility
      weaknesses: legacyWeaknesses,
      validityFlags: analysisResult.scoringResult.validityFlags,
      modelVersion: analysisResult.modelVersion,
      promptVersion: analysisResult.promptVersion,
      tokensUsed: analysisResult.totalTokensUsed,
      reportVersion: 'v2',
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
