'use client';

import { PersonalityAssessment } from '@/components/personality';

export default function PersonalityTestPage() {
  const handleSubmit = async (responses: Record<string, string>) => {
    console.log('Submitted responses:', responses);
    alert('検査完了！コンソールで回答を確認できます。');
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">適職診断</h1>
        <PersonalityAssessment
          candidateId="test-candidate-001"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
