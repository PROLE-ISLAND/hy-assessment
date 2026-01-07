'use client';

import { useState } from 'react';
import { AssessmentSelector, type AssessmentType } from '@/app/assessment/[token]/AssessmentSelector';

export default function AssessmentSelectorTestPage() {
  const [selected, setSelected] = useState<AssessmentType | null>(null);
  const [completed, setCompleted] = useState<AssessmentType[]>([]);

  const handleSelect = (type: AssessmentType) => {
    setSelected(type);
    alert(`${type === 'gate' ? 'Gate検査' : '適職診断'}を選択しました`);
  };

  const toggleCompleted = (type: AssessmentType) => {
    setCompleted((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold">検査選択画面テスト</h1>

        {/* コントロール */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm font-medium mb-2">テスト用コントロール:</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={completed.includes('gate')}
                onChange={() => toggleCompleted('gate')}
              />
              Gate検査完了
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={completed.includes('personality')}
                onChange={() => toggleCompleted('personality')}
              />
              適職診断完了
            </label>
          </div>
          {selected && (
            <p className="mt-2 text-sm">選択された検査: {selected}</p>
          )}
        </div>

        {/* 検査選択コンポーネント */}
        <AssessmentSelector
          onSelect={handleSelect}
          completedTypes={completed}
        />
      </div>
    </div>
  );
}
