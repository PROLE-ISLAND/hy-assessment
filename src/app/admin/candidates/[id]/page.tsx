// =====================================================
// Candidate Detail Page
// With tabbed layout: Basic Info / Analysis Results
// Uses design system for consistent styling
// =====================================================

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Download } from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CandidateDetailTabs } from '@/components/candidates/CandidateDetailTabs';
import { PageBreadcrumb } from '@/components/layout';
import { POSITIONS } from '@/lib/constants/positions';
import { calculateJudgment, calculateOverallScore, generateInterviewPoints, type DomainScores } from '@/lib/analysis/judgment';
import {
  judgmentConfig,
  type JudgmentLevel,
} from '@/lib/design-system';
import type { AssessmentStatus } from '@/types/database';

interface CandidateDetail {
  id: string;
  position: string;
  desired_positions: string[] | null;
  notes: string | null;
  created_at: string;
  person: {
    id: string;
    name: string;
    email: string;
  };
  assessments: Array<{
    id: string;
    token: string;
    status: AssessmentStatus;
    expires_at: string;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
  }>;
}

interface AnalysisData {
  id: string;
  assessment_id: string;
  scores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  summary: string | null;
  recommendation: string | null;
  is_latest: boolean;
}

function getPositionLabel(value: string): string {
  const position = POSITIONS.find(p => p.value === value);
  return position?.label || value;
}

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get current user and organization
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: userProfile } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single<{ organization_id: string }>();

  if (!userProfile?.organization_id) {
    notFound();
  }

  // Get candidate with relations
  const { data: candidate, error } = await adminSupabase
    .from('candidates')
    .select(`
      id,
      position,
      desired_positions,
      notes,
      created_at,
      person:persons!inner(
        id,
        name,
        email
      ),
      assessments(
        id,
        token,
        status,
        expires_at,
        created_at,
        started_at,
        completed_at
      )
    `)
    .eq('id', id)
    .eq('organization_id', userProfile.organization_id)
    .is('deleted_at', null)
    .single<CandidateDetail>();

  if (error || !candidate) {
    notFound();
  }

  // Get default template
  const { data: template } = await adminSupabase
    .from('assessment_templates')
    .select('id')
    .eq('organization_id', userProfile.organization_id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .limit(1)
    .single<{ id: string }>();

  const latestAssessment = candidate.assessments?.[0];

  // Fetch analysis for completed assessment
  let analysis: AnalysisData | null = null;
  if (latestAssessment?.status === 'completed') {
    const { data } = await adminSupabase
      .from('ai_analyses')
      .select('id, assessment_id, scores, strengths, weaknesses, summary, recommendation, is_latest')
      .eq('assessment_id', latestAssessment.id)
      .eq('is_latest', true)
      .single<AnalysisData>();
    analysis = data;
  }

  // Calculate judgment and interview points
  const scores = analysis?.scores as DomainScores | undefined;
  const overallScore = scores ? calculateOverallScore(scores) : null;
  const judgment = scores ? calculateJudgment(scores) : null;
  const interviewPoints = scores ? generateInterviewPoints(scores) : [];
  const JudgmentIcon = judgment ? judgmentConfig[judgment.level as JudgmentLevel].icon : null;

  // Transform data for client component
  const candidateData = {
    id: candidate.id,
    position: candidate.position,
    desiredPositions: candidate.desired_positions || [],
    notes: candidate.notes,
    createdAt: candidate.created_at,
    person: {
      id: candidate.person.id,
      name: candidate.person.name,
      email: candidate.person.email,
    },
  };

  const latestAssessmentData = latestAssessment ? {
    id: latestAssessment.id,
    token: latestAssessment.token,
    status: latestAssessment.status,
    expiresAt: latestAssessment.expires_at,
    createdAt: latestAssessment.created_at,
    startedAt: latestAssessment.started_at,
    completedAt: latestAssessment.completed_at,
  } : null;

  const analysisData = analysis ? {
    id: analysis.id,
    scores: analysis.scores,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
    summary: analysis.summary,
    recommendation: analysis.recommendation,
  } : null;

  const judgmentData = judgment ? {
    level: judgment.level,
    label: judgment.label,
    reasons: judgment.reasons,
    bgColor: judgment.bgColor,
    color: judgment.color,
  } : null;

  const assessmentHistory = candidate.assessments.slice(1).map(a => ({
    id: a.id,
    token: a.token,
    status: a.status,
    expiresAt: a.expires_at,
    createdAt: a.created_at,
    startedAt: a.started_at,
    completedAt: a.completed_at,
  }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <PageBreadcrumb
        items={[{ label: '候補者', href: '/admin/candidates' }]}
        currentPage={candidate.person.name}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {candidate.person.name}
          </h1>
          <p className="text-muted-foreground">
            {candidate.desired_positions && candidate.desired_positions.length > 0
              ? candidate.desired_positions.map(getPositionLabel).join('、')
              : candidate.position
                ? getPositionLabel(candidate.position)
                : '職種未設定'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {judgment && JudgmentIcon && (
            <Badge className={judgmentConfig[judgment.level as JudgmentLevel].badgeClass}>
              <JudgmentIcon className={`h-3 w-3 mr-1 ${judgmentConfig[judgment.level as JudgmentLevel].iconClass}`} />
              {judgmentConfig[judgment.level as JudgmentLevel].label}
            </Badge>
          )}
          {analysis && latestAssessment && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/analysis/pdf/${latestAssessment.id}`} download>
                <Download className="mr-2 h-4 w-4" />
                PDF出力
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Suspense fallback={<div>Loading...</div>}>
        <CandidateDetailTabs
          candidate={candidateData}
          latestAssessment={latestAssessmentData}
          analysis={analysisData}
          overallScore={overallScore}
          judgment={judgmentData}
          interviewPoints={interviewPoints}
          organizationId={userProfile.organization_id}
          templateId={template?.id || null}
          assessmentHistory={assessmentHistory}
        />
      </Suspense>
    </div>
  );
}
