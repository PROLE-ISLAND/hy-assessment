'use client';

// =====================================================
// Assessment Form - SurveyJS integration
// =====================================================

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.min.css';
import type { SurveyJSDefinition, AssessmentProgress } from '@/types/database';

// Japanese localization
import { surveyLocalization } from 'survey-core';
surveyLocalization.locales['ja'] = {
  pagePrevText: '前へ',
  pageNextText: '次へ',
  completeText: '送信',
  requiredError: 'この項目は必須です',
  progressText: '{0}/{1} ページ',
};

interface AssessmentFormProps {
  assessmentId: string;
  token: string;
  questions: SurveyJSDefinition;
  initialData: Record<string, unknown>;
  initialProgress: AssessmentProgress;
}

export function AssessmentForm({
  assessmentId,
  token,
  questions,
  initialData,
  initialProgress,
}: AssessmentFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create survey model (client-side only to avoid hydration mismatch)
  const surveyModel = useRef<Model | null>(null);

  // Initialize on client side only
  useEffect(() => {
    if (!surveyModel.current) {
      surveyModel.current = new Model(questions);
      surveyModel.current.locale = 'ja';

      // Set initial data if resuming
      if (Object.keys(initialData).length > 0) {
        surveyModel.current.data = initialData;
      }

      // Restore page if resuming
      if (initialProgress?.currentPage !== undefined) {
        surveyModel.current.currentPageNo = initialProgress.currentPage;
      }
    }
    setIsClient(true);
  }, [questions, initialData, initialProgress]);

  // Save response to server
  const saveResponse = useCallback(
    async (questionId: string, answer: unknown, pageNumber: number) => {
      try {
        const response = await fetch(`/api/assessment/${token}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId,
            answer,
            pageNumber,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save response');
        }

        setLastSaved(new Date());
        setError(null);
      } catch (err) {
        console.error('Save error:', err);
        setError('保存に失敗しました。接続を確認してください。');
      }
    },
    [token]
  );

  // Update progress on server
  const updateProgress = useCallback(
    async (currentPage: number, totalPages: number) => {
      try {
        await fetch(`/api/assessment/${token}/progress`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPage,
            totalPages,
          }),
        });
      } catch (err) {
        console.error('Progress update error:', err);
      }
    },
    [token]
  );

  // Complete assessment
  const completeAssessment = useCallback(async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/assessment/${token}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to complete assessment');
      }

      router.push('/assessment/complete');
    } catch (err) {
      console.error('Complete error:', err);
      setError('送信に失敗しました。再度お試しください。');
      setIsSaving(false);
    }
  }, [token, router]);

  // Setup survey event handlers
  useEffect(() => {
    const survey = surveyModel.current;
    if (!survey) return;

    // Auto-save on value change (debounced)
    const handleValueChanged = (sender: Model, options: { name: string; value: unknown }) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(async () => {
        await saveResponse(
          options.name,
          options.value,
          sender.currentPageNo
        );
        setIsSaving(false);
      }, 500);
    };

    // Save progress on page change
    const handlePageChanged = (sender: Model) => {
      updateProgress(sender.currentPageNo, sender.visiblePageCount);
    };

    // Handle survey completion
    const handleComplete = () => {
      completeAssessment();
    };

    survey.onValueChanged.add(handleValueChanged);
    survey.onCurrentPageChanged.add(handlePageChanged);
    survey.onComplete.add(handleComplete);

    return () => {
      survey.onValueChanged.remove(handleValueChanged);
      survey.onCurrentPageChanged.remove(handlePageChanged);
      survey.onComplete.remove(handleComplete);
    };
  }, [saveResponse, updateProgress, completeAssessment]);

  // Warn before leaving page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            {questions.title || '適性検査'}
          </h1>
          <div className="flex items-center gap-2 text-sm">
            {isSaving ? (
              <span className="text-gray-500">
                <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-1" />
                保存中...
              </span>
            ) : lastSaved ? (
              <span className="text-green-600">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1" />
                保存済み
              </span>
            ) : null}
          </div>
        </div>
        {questions.description && (
          <p className="mt-2 text-sm text-gray-600">{questions.description}</p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Survey - render only on client to avoid hydration mismatch */}
      <div className="bg-white rounded-lg shadow-sm">
        {isClient && surveyModel.current ? (
          <Survey model={surveyModel.current} />
        ) : (
          <div className="p-8 text-center text-gray-500">
            読み込み中...
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>回答は自動的に保存されます。途中でブラウザを閉じても続きから再開できます。</p>
      </div>
    </div>
  );
}
