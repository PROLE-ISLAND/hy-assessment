'use client';

// =====================================================
// Assessment Page Client
// Handles candidate info form → assessment flow
// =====================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CandidateInfoForm } from './CandidateInfoForm';
import { AssessmentForm } from './AssessmentForm';

interface AssessmentPageClientProps {
  token: string;
  assessmentId: string;
  questions: Record<string, unknown>;
}

export function AssessmentPageClient({
  token,
  assessmentId,
  questions,
}: AssessmentPageClientProps) {
  const router = useRouter();
  const [showAssessment, setShowAssessment] = useState(false);

  const handleInfoComplete = () => {
    // Refresh the page to get updated data and start assessment
    router.refresh();
    setShowAssessment(true);
  };

  if (showAssessment) {
    return (
      <AssessmentForm
        assessmentId={assessmentId}
        token={token}
        questions={questions}
        initialData={{}}
        initialProgress={{}}
      />
    );
  }

  return <CandidateInfoForm token={token} onComplete={handleInfoComplete} />;
}
