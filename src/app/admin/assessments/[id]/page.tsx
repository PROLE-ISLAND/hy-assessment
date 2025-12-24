// =====================================================
// Assessment Detail Page
// Shows detailed analysis results for a single assessment
// Uses design system for consistent styling
// =====================================================

import { notFound } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/layout';
import { AnalysisResultsClient } from '@/components/analysis';
import { calculateJudgment, type DomainScores } from '@/lib/analysis/judgment';
import {
  assessmentStatusConfig,
  judgmentConfig,
  type JudgmentLevel,
} from '@/lib/design-system';
import type {
  AssessmentStatus,
  EnhancedStrength,
  EnhancedWatchout,
  RiskScenario,
  InterviewCheck,
  CandidateReport,
} from '@/types/database';

// Type for assessment with relations
interface AssessmentDetail {
  id: string;
  status: AssessmentStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  candidates: {
    id: string;
    position: string;
    persons: {
      name: string;
      email: string;
    };
  };
  assessment_templates: {
    name: string;
    version: string;
  };
  ai_analyses: Array<{
    id: string;
    scores: Record<string, number>;
    strengths: string[];
    weaknesses: string[];
    summary: string | null;
    recommendation: string | null;
    model_version: string;
    prompt_version: string;
    tokens_used: number;
    version: number;
    is_latest: boolean;
    analyzed_at: string;
    // v2 enhanced fields
    enhanced_strengths: EnhancedStrength[] | null;
    enhanced_watchouts: EnhancedWatchout[] | null;
    risk_scenarios: RiskScenario[] | null;
    interview_checks: InterviewCheck[] | null;
    candidate_report: CandidateReport | null;
    report_version: 'v1' | 'v2';
  }>;
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssessmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get current user and verify access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  // Get user's organization
  const { data: dbUser } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single<{ organization_id: string }>();

  if (!dbUser?.organization_id) {
    notFound();
  }

  // Get assessment with relations (using admin client)
  const { data: assessment, error } = await adminSupabase
    .from('assessments')
    .select(`
      id,
      status,
      started_at,
      completed_at,
      created_at,
      candidates!inner(
        id,
        position,
        persons!inner(
          name,
          email
        )
      ),
      assessment_templates!inner(
        name,
        version
      ),
      ai_analyses(
        id,
        scores,
        strengths,
        weaknesses,
        summary,
        recommendation,
        model_version,
        prompt_version,
        tokens_used,
        version,
        is_latest,
        analyzed_at,
        enhanced_strengths,
        enhanced_watchouts,
        risk_scenarios,
        interview_checks,
        candidate_report,
        report_version
      )
    `)
    .eq('id', id)
    .eq('organization_id', dbUser.organization_id)
    .is('deleted_at', null)
    .single<AssessmentDetail>();

  if (error || !assessment) {
    notFound();
  }

  const latestAnalysis = assessment.ai_analyses?.find(a => a.is_latest) || null;

  // Calculate judgment for header badge
  const judgment = latestAnalysis ? calculateJudgment(latestAnalysis.scores as unknown as DomainScores) : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <PageBreadcrumb
        items={[
          { label: '候補者', href: '/admin/candidates' },
          { label: assessment.candidates.persons.name, href: `/admin/candidates/${assessment.candidates.id}` },
        ]}
        currentPage="分析結果"
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {assessment.candidates?.persons?.name}
            </h1>
            {judgment && (() => {
              const config = judgmentConfig[judgment.level as JudgmentLevel];
              const Icon = config.icon;
              return (
                <Badge className={`${config.badgeClass} text-sm px-3 py-1`}>
                  <Icon className={`h-4 w-4 mr-1 ${config.iconClass}`} />
                  {config.label}
                </Badge>
              );
            })()}
          </div>
          <p className="text-muted-foreground">
            {assessment.candidates?.position} · {assessment.assessment_templates?.name}
          </p>
        </div>
      </div>

      {/* Basic Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">候補者</div>
              <div className="font-medium">{assessment.candidates?.persons?.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">メール</div>
              <div className="font-medium">{assessment.candidates?.persons?.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">応募職種</div>
              <div className="font-medium">{assessment.candidates?.position}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">ステータス</div>
              <Badge className={assessmentStatusConfig[assessment.status].className} variant="secondary">
                {assessmentStatusConfig[assessment.status].label}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">検査開始</div>
              <div className="font-medium">{formatDate(assessment.started_at)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">検査完了</div>
              <div className="font-medium">{formatDate(assessment.completed_at)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">分析日時</div>
              <div className="font-medium">
                {latestAnalysis ? formatDate(latestAnalysis.analyzed_at) : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">分析バージョン</div>
              <div className="font-medium">
                {latestAnalysis ? `v${latestAnalysis.version}` : '-'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results (Client Component with tabs, history, re-analyze) */}
      <AnalysisResultsClient
        assessmentId={assessment.id}
        initialAnalysis={latestAnalysis}
        assessmentStatus={assessment.status}
      />
    </div>
  );
}
