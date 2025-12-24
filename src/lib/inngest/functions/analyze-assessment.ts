// =====================================================
// Analyze Assessment Function
// Background job for AI analysis of completed assessments
// =====================================================

import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server';
import { type ResponseData } from '@/lib/analysis';
import {
  analyzeAssessment,
  analyzeAssessmentMock,
  analyzeAssessmentFull,
  analyzeAssessmentFullMock,
} from '@/lib/analysis/ai-analyzer';
import { sendAssessmentCompletion } from '@/lib/email';
import type { AIAnalysis } from '@/types/database';

// Use mock in development if OPENAI_API_KEY is not set
const USE_MOCK = !process.env.OPENAI_API_KEY;

export const analyzeAssessmentFunction = inngest.createFunction(
  {
    id: 'analyze-assessment',
    retries: 3,
  },
  { event: 'analysis/requested' },
  async ({ event, step }) => {
    const { assessmentId, organizationId, candidatePosition } = event.data;

    // Step 1: Fetch responses
    const responses = await step.run('fetch-responses', async () => {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('responses')
        .select('question_id, answer')
        .eq('assessment_id', assessmentId)
        .returns<ResponseData[]>();

      if (error) {
        throw new Error(`Failed to fetch responses: ${error.message}`);
      }

      return data || [];
    });

    if (responses.length === 0) {
      return { success: false, error: 'No responses found' };
    }

    // Step 2: Run v2 AI analysis
    const analysisResult = await step.run('run-analysis', async () => {
      const input = {
        responses,
        candidatePosition,
        organizationId,
      };

      // Use v2 full analysis by default
      return USE_MOCK
        ? await analyzeAssessmentFullMock(input)
        : await analyzeAssessmentFull(input);
    });

    // Step 3: Save analysis to database
    const savedAnalysis = await step.run('save-analysis', async () => {
      const supabase = createAdminClient();

      // Extract v2 fields (always available in full analysis)
      const { internalReport, candidateReport: candidateReportData } = analysisResult;

      // Build legacy fields from v2 for backward compatibility
      const legacyStrengths = internalReport.strengths.map((s: { behavior: string }) => s.behavior);
      const legacyWeaknesses = internalReport.watchouts.map((w: { risk: string }) => w.risk);

      const insertData: Omit<AIAnalysis, 'id' | 'created_at'> = {
        assessment_id: assessmentId,
        organization_id: organizationId,
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
        candidate_report: candidateReportData,
        report_version: 'v2',
      };

      const { data, error } = await supabase
        .from('ai_analyses')
        .insert(insertData as never)
        .select('id')
        .single<{ id: string }>();

      if (error) {
        throw new Error(`Failed to save analysis: ${error.message}`);
      }

      return data;
    });

    // Step 4: Send notification email to admins
    await step.run('notify-admins', async () => {
      const supabase = createAdminClient();

      // Get assessment with candidate info
      const { data: assessment } = await supabase
        .from('assessments')
        .select(`
          id,
          candidates!inner (
            persons!inner (
              name,
              email
            )
          )
        `)
        .eq('id', assessmentId)
        .single<{
          id: string;
          candidates: {
            persons: { name: string; email: string };
          };
        }>();

      if (!assessment) return;

      // Get admin users
      const { data: admins } = await supabase
        .from('users')
        .select('email, name')
        .eq('organization_id', organizationId)
        .eq('role', 'admin')
        .returns<Array<{ email: string; name: string | null }>>();

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const detailUrl = `${baseUrl}/admin/assessments/${assessmentId}`;
      const candidatePerson = assessment.candidates.persons;

      // Send email to each admin
      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await sendAssessmentCompletion({
            adminEmail: admin.email,
            adminName: admin.name || undefined,
            candidateName: candidatePerson.name,
            candidateEmail: candidatePerson.email,
            completedAt: new Date(),
            detailUrl,
            analysisStatus: 'completed',
          });
        }
      }
    });

    return {
      success: true,
      analysisId: savedAnalysis?.id,
    };
  }
);
