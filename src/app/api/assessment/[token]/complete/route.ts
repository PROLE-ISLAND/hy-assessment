// =====================================================
// Complete Assessment API
// Marks assessment as complete and triggers async analysis
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest/client';

// Feature flag: use async processing via Inngest
const USE_ASYNC_ANALYSIS = process.env.USE_ASYNC_ANALYSIS === 'true';

// For synchronous fallback
import { type ResponseData } from '@/lib/analysis';
import {
  analyzeAssessmentFull,
  analyzeAssessmentFullMock,
} from '@/lib/analysis/ai-analyzer';
import { sendAssessmentCompletion } from '@/lib/email';
import type { AIAnalysis } from '@/types/database';

const USE_MOCK = !process.env.OPENAI_API_KEY;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    // Get assessment by token with candidate info
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        id,
        organization_id,
        status,
        expires_at,
        candidates!inner (
          id,
          position,
          persons!inner (
            name,
            email
          )
        )
      `)
      .eq('token', token)
      .is('deleted_at', null)
      .single<{
        id: string;
        organization_id: string;
        status: string;
        expires_at: string;
        candidates: {
          id: string;
          position: string;
          persons: { name: string; email: string };
        };
      }>();

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

    // Update status to completed
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        status: 'completed' as const,
        completed_at: new Date().toISOString(),
      } as never)
      .eq('id', assessment.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete assessment' },
        { status: 500 }
      );
    }

    // Use async processing if enabled
    if (USE_ASYNC_ANALYSIS) {
      // Trigger async analysis via Inngest
      await inngest.send({
        name: 'analysis/requested',
        data: {
          assessmentId: assessment.id,
          organizationId: assessment.organization_id,
          candidatePosition: assessment.candidates?.position || '不明',
        },
      });

      return NextResponse.json({
        success: true,
        assessmentId: assessment.id,
        analysis: { success: true, status: 'pending' },
      });
    }

    // Synchronous fallback (default for MVP)
    let analysisResult: {
      success: boolean;
      analysisId?: string;
      error?: string;
    } = { success: false };

    try {
      // Get responses
      const { data: responses, error: responsesError } = await supabase
        .from('responses')
        .select('question_id, answer')
        .eq('assessment_id', assessment.id)
        .returns<ResponseData[]>();

      if (responsesError) {
        console.error('Responses query error at completion:', {
          error: responsesError,
          assessmentId: assessment.id,
          code: responsesError.code,
          message: responsesError.message,
        });
        analysisResult = { success: false, error: `回答データ取得エラー: ${responsesError.message}` };
      } else if (responses && responses.length > 0) {
        const candidatePosition = assessment.candidates?.position || '不明';
        const analysisInput = {
          responses,
          candidatePosition,
          organizationId: assessment.organization_id,
        };

        // Use v2 full analysis by default
        const result = USE_MOCK
          ? await analyzeAssessmentFullMock(analysisInput)
          : await analyzeAssessmentFull(analysisInput);

        // Extract v2 fields (always available in full analysis)
        const { internalReport, candidateReport: candidateReportData } = result;

        // Build legacy fields from v2 for backward compatibility
        const legacyStrengths = internalReport.strengths.map((s) => s.behavior);
        const legacyWeaknesses = internalReport.watchouts.map((w) => w.risk);

        // Save analysis to database
        const insertData: Omit<AIAnalysis, 'id' | 'created_at'> = {
          assessment_id: assessment.id,
          organization_id: assessment.organization_id,
          scores: Object.fromEntries(
            Object.entries(result.scoringResult.domainScores).map(
              ([key, score]) => [key, score.percentage]
            )
          ),
          // Legacy fields (for backward compatibility)
          strengths: legacyStrengths,
          weaknesses: legacyWeaknesses,
          summary: internalReport.summary,
          recommendation: internalReport.recommendation,
          model_version: result.modelVersion,
          prompt_version: result.promptVersion,
          tokens_used: result.totalTokensUsed,
          version: 1,
          is_latest: true,
          analyzed_at: new Date().toISOString(),
          // v2 enhanced fields
          enhanced_strengths: internalReport.strengths,
          enhanced_watchouts: internalReport.watchouts,
          risk_scenarios: internalReport.risk_scenarios,
          interview_checks: internalReport.interview_checks,
          candidate_report: candidateReportData,
          report_version: 'v2',
          // v3 personality analysis fields (null for now, populated separately)
          behavioral_analysis: null,
          stress_resilience: null,
          eq_analysis: null,
          values_analysis: null,
        };

        const { data: savedAnalysis, error: saveError } = await supabase
          .from('ai_analyses')
          .insert(insertData as never)
          .select('id')
          .single<{ id: string }>();

        if (saveError) {
          console.error('Save analysis error:', saveError);
          analysisResult = { success: false, error: '分析結果の保存に失敗しました' };
        } else {
          analysisResult = { success: true, analysisId: savedAnalysis?.id };
        }
      } else {
        console.warn('No responses found at completion:', { assessmentId: assessment.id });
        analysisResult = { success: false, error: '回答データがありません' };
      }
    } catch (analysisError) {
      console.error('Analysis error:', analysisError);
      analysisResult = {
        success: false,
        error: analysisError instanceof Error ? analysisError.message : 'Analysis failed',
      };
    }

    // Send completion notification to admin(s)
    try {
      const { data: admins } = await supabase
        .from('users')
        .select('email, name')
        .eq('organization_id', assessment.organization_id)
        .eq('role', 'admin')
        .returns<Array<{ email: string; name: string | null }>>();

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const detailUrl = `${baseUrl}/admin/assessments/${assessment.id}`;
      const candidatePerson = assessment.candidates.persons;

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await sendAssessmentCompletion({
            adminEmail: admin.email,
            adminName: admin.name || undefined,
            candidateName: candidatePerson.name,
            candidateEmail: candidatePerson.email,
            completedAt: new Date(),
            detailUrl,
            analysisStatus: analysisResult.success ? 'completed' : 'failed',
          });
        }
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    return NextResponse.json({
      success: true,
      assessmentId: assessment.id,
      analysis: analysisResult,
    });
  } catch (error) {
    console.error('Complete assessment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
