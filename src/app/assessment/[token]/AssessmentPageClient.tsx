'use client';

// =====================================================
// Assessment Page Client
// Handles candidate info → assessment selector → assessment flow
// =====================================================

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CandidateInfoForm } from './CandidateInfoForm';
import { AssessmentForm } from './AssessmentForm';
import { AssessmentSelector, type AssessmentType } from './AssessmentSelector';
import { PersonalityAssessment } from '@/components/personality';

type Step = 'info' | 'select' | 'gate' | 'personality';

interface AssessmentPageClientProps {
  token: string;
  questions: Record<string, unknown>;
  candidateId?: string;
  skipInfo?: boolean;
  completedTypes?: AssessmentType[];
}

export function AssessmentPageClient({
  token,
  questions,
  candidateId,
  skipInfo = false,
  completedTypes = [],
}: AssessmentPageClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(skipInfo ? 'select' : 'info');
  const [completed, setCompleted] = useState<AssessmentType[]>(completedTypes);

  const handleInfoComplete = () => {
    router.refresh();
    setStep('select');
  };

  const handleSelectAssessment = (type: AssessmentType) => {
    setStep(type);
  };

  const handleAssessmentComplete = useCallback((type: AssessmentType) => {
    setCompleted((prev) => [...prev, type]);

    // 両方完了したら完了ページへ
    const newCompleted = [...completed, type];
    if (newCompleted.includes('gate') && newCompleted.includes('personality')) {
      router.push('/assessment/complete');
    } else {
      // 選択画面に戻る
      setStep('select');
    }
  }, [completed, router]);

  const handlePersonalitySubmit = async (responses: Record<string, string>) => {
    // TODO: APIに送信
    console.log('Personality responses:', responses);
    handleAssessmentComplete('personality');
  };

  // Step: 候補者情報入力
  if (step === 'info') {
    return <CandidateInfoForm token={token} onComplete={handleInfoComplete} />;
  }

  // Step: 検査選択
  if (step === 'select') {
    return (
      <AssessmentSelector
        onSelect={handleSelectAssessment}
        completedTypes={completed}
      />
    );
  }

  // Step: Gate検査
  if (step === 'gate') {
    return (
      <AssessmentForm
        token={token}
        questions={questions}
        initialData={{}}
        initialProgress={{}}
      />
    );
  }

  // Step: 適職診断
  if (step === 'personality') {
    return (
      <PersonalityAssessment
        candidateId={candidateId || token}
        onSubmit={handlePersonalitySubmit}
      />
    );
  }

  return null;
}
