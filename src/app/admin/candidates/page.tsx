// =====================================================
// Candidates List Page
// List of all candidates with filters, scores, and judgments
// =====================================================

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CandidateListClient } from '@/components/candidates';
import type { CandidateCardData, CandidateStatus } from '@/components/candidates';
import { POSITIONS } from '@/lib/constants/positions';
import { calculateJudgment, calculateOverallScore } from '@/lib/analysis/judgment';
import type { AssessmentStatus } from '@/types/database';

// Type for the query result
interface CandidateWithRelations {
  id: string;
  position: string;
  notes: string | null;
  created_at: string;
  persons: {
    id: string;
    name: string;
    email: string;
  };
  assessments: Array<{
    id: string;
    status: AssessmentStatus;
    expires_at: string;
    completed_at: string | null;
    created_at: string;
  }>;
}

interface AnalysisData {
  assessment_id: string;
  scores: Record<string, number>;
  is_latest: boolean;
}

function mapToCardStatus(assessment: CandidateWithRelations['assessments'][0] | undefined, hasAnalysis: boolean): CandidateStatus {
  if (!assessment) return 'no_assessment';
  if (hasAnalysis) return 'analyzed';
  switch (assessment.status) {
    case 'pending': return 'pending';
    case 'in_progress': return 'in_progress';
    case 'completed': return 'completed';
    case 'expired': return 'no_assessment'; // Treat expired as needing new assessment
    default: return 'no_assessment';
  }
}

export default async function CandidatesListPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get current user and organization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  const { data: dbUser } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single<{ organization_id: string }>();

  if (!dbUser?.organization_id) {
    notFound();
  }

  // Get candidates with their person info and assessments
  const { data: candidates, error } = await adminSupabase
    .from('candidates')
    .select(`
      id,
      position,
      notes,
      created_at,
      persons!inner(
        id,
        name,
        email
      ),
      assessments(
        id,
        status,
        expires_at,
        completed_at,
        created_at
      )
    `)
    .eq('organization_id', dbUser.organization_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .returns<CandidateWithRelations[]>();

  if (error) {
    console.error('Error fetching candidates:', error);
  }

  // Get assessment IDs for fetching analysis
  const assessmentIds = (candidates || [])
    .flatMap(c => c.assessments.map(a => a.id))
    .filter(Boolean);

  // Fetch analyses for all assessments
  const { data: analyses } = assessmentIds.length > 0
    ? await adminSupabase
        .from('ai_analyses')
        .select('assessment_id, scores, is_latest')
        .in('assessment_id', assessmentIds)
        .eq('is_latest', true)
        .returns<AnalysisData[]>()
    : { data: [] };

  // Create a map of assessment_id -> analysis
  const analysisMap = new Map<string, AnalysisData>();
  (analyses || []).forEach(a => {
    analysisMap.set(a.assessment_id, a);
  });

  // Transform to CandidateCardData
  const cardData: CandidateCardData[] = (candidates || []).map(candidate => {
    const latestAssessment = candidate.assessments?.[0];
    const analysis = latestAssessment ? analysisMap.get(latestAssessment.id) : undefined;
    const hasAnalysis = !!analysis;

    const overallScore = analysis ? calculateOverallScore(analysis.scores) : undefined;
    const judgment = analysis ? calculateJudgment(analysis.scores) : undefined;

    const positionInfo = POSITIONS.find(p => p.value === candidate.position);

    return {
      id: candidate.id,
      name: candidate.persons.name,
      email: candidate.persons.email,
      position: candidate.position,
      positionLabel: positionInfo?.label || candidate.position || '未設定',
      status: mapToCardStatus(latestAssessment, hasAnalysis),
      overallScore,
      judgment: judgment?.level,
      expiresAt: latestAssessment?.expires_at,
      completedAt: latestAssessment?.completed_at || undefined,
      createdAt: candidate.created_at,
      assessmentId: hasAnalysis ? latestAssessment?.id : undefined,
    };
  });

  // Get unique positions for filter
  const uniquePositions = [...new Set(cardData.map(c => c.position).filter(Boolean))];
  const positionOptions = uniquePositions.map(p => ({
    value: p,
    label: POSITIONS.find(pos => pos.value === p)?.label || p,
  }));

  return (
    <CandidateListClient
      candidates={cardData}
      positions={positionOptions}
    />
  );
}
