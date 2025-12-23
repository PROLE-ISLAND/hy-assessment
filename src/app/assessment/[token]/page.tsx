// =====================================================
// Assessment Page - Candidate takes the assessment
// =====================================================

import { redirect, notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { AssessmentForm } from './AssessmentForm';
import { AssessmentPageClient } from './AssessmentPageClient';
import type { Assessment, AssessmentTemplate } from '@/types/database';

interface AssessmentWithTemplate extends Assessment {
  template: AssessmentTemplate;
  candidate: {
    id: string;
    desired_positions: string[] | null;
    person: {
      id: string;
      name: string;
      email: string;
    };
  };
}

interface AssessmentPageProps {
  params: Promise<{ token: string }>;
}

export default async function AssessmentPage({ params }: AssessmentPageProps) {
  const { token } = await params;
  // Use admin client to bypass RLS - token-based auth for candidates
  const supabase = createAdminClient();

  // Fetch assessment by token with candidate info
  const { data: assessment, error } = await supabase
    .from('assessments')
    .select(`
      *,
      template:assessment_templates(*),
      candidate:candidates(
        id,
        desired_positions,
        person:persons(
          id,
          name,
          email
        )
      )
    `)
    .eq('token', token)
    .is('deleted_at', null)
    .single<AssessmentWithTemplate>();

  if (error || !assessment) {
    notFound();
  }

  // Check if expired
  const now = new Date();
  const expiresAt = new Date(assessment.expires_at);
  if (now > expiresAt || assessment.status === 'expired') {
    redirect('/assessment/expired');
  }

  // Check if already completed
  if (assessment.status === 'completed') {
    redirect('/assessment/complete');
  }

  // Check if candidate info needs to be filled
  const candidateName = assessment.candidate?.person?.name || '';
  const candidateEmail = assessment.candidate?.person?.email || '';
  const desiredPositions = assessment.candidate?.desired_positions || [];

  // Need info if name is empty, placeholder, or no positions selected
  const needsCandidateInfo =
    !candidateName.trim() ||
    candidateName === '未入力' ||
    candidateName === '候補者' ||
    !candidateEmail.trim() ||
    desiredPositions.length === 0;

  // If candidate info is missing, show the client component that handles both states
  if (needsCandidateInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <AssessmentPageClient
            token={token}
            assessmentId={assessment.id}
            questions={assessment.template.questions}
          />
        </div>
      </div>
    );
  }

  // Update status to in_progress if pending
  if (assessment.status === 'pending') {
    await supabase
      .from('assessments')
      .update({
        status: 'in_progress' as const,
        started_at: new Date().toISOString(),
      } as never)
      .eq('id', assessment.id);
  }

  // Fetch existing responses for resume capability
  const { data: existingResponses } = await supabase
    .from('responses')
    .select('question_id, answer')
    .eq('assessment_id', assessment.id)
    .returns<Array<{ question_id: string; answer: unknown }>>();

  // Convert responses to SurveyJS data format
  const initialData: Record<string, unknown> = {};
  if (existingResponses) {
    for (const response of existingResponses) {
      initialData[response.question_id] = response.answer;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <AssessmentForm
          assessmentId={assessment.id}
          token={token}
          questions={assessment.template.questions}
          initialData={initialData}
          initialProgress={assessment.progress}
        />
      </div>
    </div>
  );
}
