'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

// 型定義
interface Question {
  id: string;
  text: string;
  category: 'disc' | 'stress' | 'eq' | 'values';
  type: 'likert' | 'forced_choice' | 'ranking';
  options?: { value: string; label: string }[];
}

interface AssessmentSection {
  id: string;
  name: string;
  description: string;
  questions: Question[];
}

interface PersonalityAssessmentProps {
  candidateId: string;
  template?: AssessmentSection[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onSubmit?: (responses: Record<string, string>) => Promise<void>;
}

// デフォルトのLikert選択肢
const likertOptions = [
  { value: '1', label: '全くそう思わない' },
  { value: '2', label: 'あまりそう思わない' },
  { value: '3', label: 'どちらともいえない' },
  { value: '4', label: 'ややそう思う' },
  { value: '5', label: '強くそう思う' },
];

// サンプル検査テンプレート（実際はAPIから取得）
const sampleTemplate: AssessmentSection[] = [
  {
    id: 'disc',
    name: 'DISC（行動特性）',
    description: '以下の質問に対して、あなたに最も当てはまるものを選んでください',
    questions: Array.from({ length: 24 }, (_, i) => ({
      id: `disc_${i + 1}`,
      text: `DISC質問 ${i + 1}: あなたの行動傾向について`,
      category: 'disc' as const,
      type: 'forced_choice' as const,
      options: [
        { value: 'D', label: '自ら主導して進める' },
        { value: 'I', label: '周囲を巻き込んで進める' },
        { value: 'S', label: '周囲と協力して進める' },
        { value: 'C', label: '慎重に分析して進める' },
      ],
    })),
  },
  {
    id: 'stress',
    name: 'ストレス耐性',
    description: 'ストレスへの対処方法について回答してください',
    questions: Array.from({ length: 12 }, (_, i) => ({
      id: `stress_${i + 1}`,
      text: `ストレス質問 ${i + 1}: プレッシャー下での行動について`,
      category: 'stress' as const,
      type: 'likert' as const,
    })),
  },
  {
    id: 'eq',
    name: 'EQ（感情知性）',
    description: '感情の認識と管理について回答してください',
    questions: Array.from({ length: 16 }, (_, i) => ({
      id: `eq_${i + 1}`,
      text: `EQ質問 ${i + 1}: 感情の理解と対応について`,
      category: 'eq' as const,
      type: 'likert' as const,
    })),
  },
  {
    id: 'values',
    name: '価値観',
    description: '仕事における価値観について回答してください',
    questions: Array.from({ length: 15 }, (_, i) => ({
      id: `values_${i + 1}`,
      text: `価値観質問 ${i + 1}: 仕事で大切にしていること`,
      category: 'values' as const,
      type: 'likert' as const,
    })),
  },
];

// LocalStorageキー生成
const getStorageKey = (candidateId: string) =>
  `personality_assessment_${candidateId}`;

// スケルトンUI
function AssessmentSkeleton() {
  return (
    <div data-testid="personality-assessment-skeleton" className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// エラーUI
function AssessmentError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <Card data-testid="personality-assessment-error">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">検査の読み込みに失敗しました</h3>
        <p className="text-muted-foreground mb-6">
          {error.message || 'エラーが発生しました'}
        </p>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          再読み込み
        </Button>
      </CardContent>
    </Card>
  );
}

// 完了UI
function AssessmentCompleted() {
  return (
    <Card data-testid="personality-assessment-completed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-16 w-16 text-emerald-500 mb-4" />
        <h3 className="text-2xl font-bold mb-2">検査が完了しました</h3>
        <p className="text-muted-foreground">
          ご回答ありがとうございました。
          <br />
          結果は担当者がご確認いたします。
        </p>
      </CardContent>
    </Card>
  );
}

// メインコンポーネント
export function PersonalityAssessment({
  candidateId,
  template = sampleTemplate,
  isLoading,
  error,
  onRetry,
  onSubmit,
}: PersonalityAssessmentProps) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedResponses, setSavedResponses] = useState<Record<string, string> | null>(null);

  // 全質問数
  const totalQuestions = template.reduce(
    (sum, section) => sum + section.questions.length,
    0
  );

  // 現在のセクションと質問
  const currentSection = template[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];

  // 回答済み質問数
  const answeredCount = Object.keys(responses).length;

  // 進捗率
  const progressPercent = (answeredCount / totalQuestions) * 100;

  // LocalStorageから復元
  useEffect(() => {
    const storageKey = getStorageKey(candidateId);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Object.keys(parsed).length > 0) {
          setSavedResponses(parsed);
          setShowResumeDialog(true);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
  }, [candidateId]);

  // 自動保存
  const saveToLocalStorage = useCallback(() => {
    if (Object.keys(responses).length > 0) {
      localStorage.setItem(getStorageKey(candidateId), JSON.stringify(responses));
    }
  }, [candidateId, responses]);

  useEffect(() => {
    saveToLocalStorage();
  }, [saveToLocalStorage]);

  // 再開処理
  const handleResume = () => {
    if (savedResponses) {
      setResponses(savedResponses);
      // 最後の回答位置を特定
      const answeredIds = Object.keys(savedResponses);
      for (let sIdx = 0; sIdx < template.length; sIdx++) {
        for (let qIdx = 0; qIdx < template[sIdx].questions.length; qIdx++) {
          if (!answeredIds.includes(template[sIdx].questions[qIdx].id)) {
            setCurrentSectionIndex(sIdx);
            setCurrentQuestionIndex(qIdx);
            setShowResumeDialog(false);
            return;
          }
        }
      }
    }
    setShowResumeDialog(false);
  };

  // 最初から開始
  const handleStartFresh = () => {
    localStorage.removeItem(getStorageKey(candidateId));
    setResponses({});
    setCurrentSectionIndex(0);
    setCurrentQuestionIndex(0);
    setShowResumeDialog(false);
  };

  // 回答を記録
  const handleAnswer = (value: string) => {
    if (!currentQuestion) return;
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  // 次の質問へ
  const goToNext = () => {
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else if (currentSectionIndex < template.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
    }
  };

  // 前の質問へ
  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1);
      setCurrentQuestionIndex(template[currentSectionIndex - 1].questions.length - 1);
    }
  };

  // 送信
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit?.(responses);
      localStorage.removeItem(getStorageKey(candidateId));
      setIsCompleted(true);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 最後の質問かどうか
  const isLastQuestion =
    currentSectionIndex === template.length - 1 &&
    currentQuestionIndex === currentSection?.questions.length - 1;

  // 全問回答済みかどうか
  const isAllAnswered = answeredCount === totalQuestions;

  // 現在の質問番号（全体での位置）
  const currentQuestionNumber =
    template
      .slice(0, currentSectionIndex)
      .reduce((sum, s) => sum + s.questions.length, 0) +
    currentQuestionIndex +
    1;

  // 早期リターンパターン
  if (isLoading) {
    return <AssessmentSkeleton />;
  }

  if (error) {
    return <AssessmentError error={error} onRetry={onRetry} />;
  }

  if (isCompleted) {
    return <AssessmentCompleted />;
  }

  return (
    <>
      {/* 再開確認ダイアログ */}
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent data-testid="personality-assessment-resume">
          <AlertDialogHeader>
            <AlertDialogTitle>中断した検査があります</AlertDialogTitle>
            <AlertDialogDescription>
              前回の続きから再開しますか？
              {savedResponses && (
                <span className="block mt-2">
                  進捗: {Object.keys(savedResponses).length} / {totalQuestions} 問
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStartFresh}>
              最初から
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResume}>続きから再開</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 検査メイン */}
      <div data-testid="personality-assessment" className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                パーソナリティ検査
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {currentQuestionNumber} / {totalQuestions}
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-2"
              data-testid="assessment-progress-bar"
            />
            <CardDescription className="mt-4">
              <span className="font-medium">{currentSection?.name}</span>
              <br />
              {currentSection?.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 質問 */}
            {currentQuestion && (
              <div
                key={currentQuestion.id}
                data-testid={`personality-question-${currentQuestionNumber}`}
                className="space-y-4"
              >
                <h3 className="text-lg font-medium">{currentQuestion.text}</h3>

                <RadioGroup
                  value={responses[currentQuestion.id] || ''}
                  onValueChange={handleAnswer}
                  className="space-y-3"
                >
                  {(currentQuestion.options || likertOptions).map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={`${currentQuestion.id}_${option.value}`}
                      />
                      <Label
                        htmlFor={`${currentQuestion.id}_${option.value}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* ナビゲーション */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                前へ
              </Button>

              {isLastQuestion ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!isAllAnswered || isSubmitting}
                  data-testid="personality-submit"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  送信
                </Button>
              ) : (
                <Button
                  onClick={goToNext}
                  disabled={!responses[currentQuestion?.id]}
                >
                  次へ
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
