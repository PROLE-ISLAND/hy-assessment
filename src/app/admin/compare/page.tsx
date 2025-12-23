// =====================================================
// Candidate Comparison Page
// Compare multiple candidates side by side
// =====================================================

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CandidateComparisonClient } from './CandidateComparisonClient';
import { POSITIONS } from '@/lib/constants/positions';
import { calculateJudgment, calculateOverallScore } from '@/lib/analysis/judgment';

interface AnalysisWithCandidate {
  id: string;
  scores: Record<string, number>;
  assessments: {
    id: string;
    candidates: {
      id: string;
      position: string;
      desired_positions: string[] | null;
      persons: { name: string };
    };
  };
}

export interface CandidateForComparison {
  id: string;
  name: string;
  position: string;
  positionLabel: string;
  assessmentId: string;
  scores: Record<string, number>;
  overallScore: number;
  judgment: {
    level: 'recommended' | 'consider' | 'caution';
    label: string;
  };
}

export default async function ComparePage() {
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

  // Get all candidates with analysis
  const { data: analyses } = await adminSupabase
    .from('ai_analyses')
    .select(`
      id,
      scores,
      assessments!inner(
        id,
        candidates!inner(
          id,
          position,
          desired_positions,
          persons!inner(name)
        )
      )
    `)
    .eq('organization_id', dbUser.organization_id)
    .eq('is_latest', true)
    .returns<AnalysisWithCandidate[]>();

  // Transform data
  const candidates: CandidateForComparison[] = (analyses || []).map(a => {
    const position = a.assessments.candidates.position || '';
    const positionInfo = POSITIONS.find(p => p.value === position);
    const judgment = calculateJudgment(a.scores);

    return {
      id: a.assessments.candidates.id,
      name: a.assessments.candidates.persons.name,
      position,
      positionLabel: positionInfo?.label || position || '未設定',
      assessmentId: a.assessments.id,
      scores: a.scores,
      overallScore: calculateOverallScore(a.scores),
      judgment: {
        level: judgment.level,
        label: judgment.label,
      },
    };
  });

  // Sort by overall score descending
  candidates.sort((a, b) => b.overallScore - a.overallScore);

  // Get unique positions
  const positions = [...new Set(candidates.map(c => c.position).filter(Boolean))];

  return (
    <CandidateComparisonClient
      candidates={candidates}
      positions={positions.map(p => ({
        value: p,
        label: POSITIONS.find(pos => pos.value === p)?.label || p,
      }))}
    />
  );
}
