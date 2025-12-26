// =====================================================
// Candidate Report Page (Public)
// Allows candidates to view their personalized report
// via a secure token-based URL (no login required)
// =====================================================

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { CandidateReportView } from '@/components/analysis/CandidateReportView';
import type { CandidateReport } from '@/types/database';

interface ReportPageProps {
  params: Promise<{ token: string }>;
}

// Types for database query
interface AssessmentWithReport {
  id: string;
  report_token: string;
  report_expires_at: string | null;
  report_viewed_at: string | null;
  candidates: {
    persons: {
      name: string;
    };
  };
  ai_analyses: Array<{
    candidate_report: CandidateReport | null;
    report_version: 'v1' | 'v2';
    is_latest: boolean;
  }>;
}

export default async function CandidateReportPage({ params }: ReportPageProps) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Fetch assessment by report_token
  const { data: assessment, error } = await supabase
    .from('assessments')
    .select(`
      id,
      report_token,
      report_expires_at,
      report_viewed_at,
      candidates!inner (
        persons!inner (
          name
        )
      ),
      ai_analyses (
        candidate_report,
        report_version,
        is_latest
      )
    `)
    .eq('report_token', token)
    .is('deleted_at', null)
    .single<AssessmentWithReport>();

  if (error || !assessment) {
    notFound();
  }

  // Check expiration
  if (assessment.report_expires_at) {
    const now = new Date();
    const expiresAt = new Date(assessment.report_expires_at);
    if (now > expiresAt) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center p-8">
            <div className="text-6xl mb-4">&#x23F3;</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              リンクの有効期限が切れています
            </h1>
            <p className="text-gray-600 mb-6">
              このレポートへのリンクは有効期限が切れました。
              新しいリンクをリクエストするか、担当者にお問い合わせください。
            </p>
            <Link
              href="/report/resend"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              リンクを再送する
            </Link>
          </div>
        </div>
      );
    }
  }

  // Get latest analysis with candidate report
  const latestAnalysis = assessment.ai_analyses?.find(a => a.is_latest);
  const candidateReport = latestAnalysis?.candidate_report;

  if (!candidateReport) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="text-6xl mb-4">&#x1F50D;</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            レポートが見つかりません
          </h1>
          <p className="text-gray-600">
            レポートの準備ができていないか、まだ分析が完了していません。
            しばらくしてから再度お試しください。
          </p>
        </div>
      </div>
    );
  }

  // Update viewed_at if first view
  if (!assessment.report_viewed_at) {
    await supabase
      .from('assessments')
      .update({ report_viewed_at: new Date().toISOString() } as never)
      .eq('id', assessment.id);
  }

  const candidateName = assessment.candidates?.persons?.name || 'あなた';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            適性検査レポート
          </h1>
          <p className="text-lg text-gray-600">
            {candidateName} さんの結果
          </p>
        </div>

        {/* Report Content */}
        <CandidateReportView report={candidateReport} />

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            このレポートは、あなたの検査結果に基づいて生成されたフィードバックです。
          </p>
        </div>
      </div>
    </div>
  );
}
