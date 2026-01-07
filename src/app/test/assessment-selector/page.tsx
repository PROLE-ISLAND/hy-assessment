'use client';

import { useState } from 'react';
import { AssessmentSelector, type AssessmentType } from '@/app/assessment/[token]/AssessmentSelector';
import { PersonalityAssessment } from '@/components/personality';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type Step = 'select' | 'gate' | 'personality';

export default function AssessmentSelectorTestPage() {
  const [step, setStep] = useState<Step>('select');
  const [completed, setCompleted] = useState<AssessmentType[]>([]);

  const handleSelect = (type: AssessmentType) => {
    setStep(type);
  };

  const handleBack = () => {
    setStep('select');
  };

  const handleComplete = (type: AssessmentType) => {
    setCompleted((prev) => [...prev, type]);
    setStep('select');
  };

  const handlePersonalitySubmit = async (responses: Record<string, string>) => {
    console.log('Responses:', responses);
    handleComplete('personality');
  };

  // 検査選択画面
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-2xl font-bold">検査選択画面テスト</h1>
          <AssessmentSelector
            onSelect={handleSelect}
            completedTypes={completed}
          />
        </div>
      </div>
    );
  }

  // Gate検査（プレースホルダー）
  if (step === 'gate') {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <div className="text-center py-20 border rounded-lg">
            <h2 className="text-xl font-bold mb-4">Gate検査</h2>
            <p className="text-muted-foreground mb-6">
              （既存のSurveyJS検査がここに表示されます）
            </p>
            <Button onClick={() => handleComplete('gate')}>
              検査を完了する（テスト用）
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 適職診断
  if (step === 'personality') {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <PersonalityAssessment
            candidateId="test-candidate-001"
            onSubmit={handlePersonalitySubmit}
          />
        </div>
      </div>
    );
  }

  return null;
}
