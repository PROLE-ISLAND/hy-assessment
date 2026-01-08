'use client';

// =====================================================
// Direct Assessment Flow (Issue #215)
// Landing page client component for direct assessment start
// Flow: CandidateInfo -> Loading -> AssessmentSelect -> Assessment
// =====================================================

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { PersonalityAssessment } from '@/components/personality/PersonalityAssessment';

// Flow step type
type FlowStep = 'candidate-info' | 'loading' | 'assessment-select' | 'assessment';

// Assessment type selection
type AssessmentType = 'gate' | 'personality';

// Job type options for selection
const JOB_TYPE_OPTIONS = [
  { value: 'account_manager', label: 'Account Manager' },
  { value: 'marketing_director', label: 'Marketing Director' },
  { value: 'content_planner', label: 'Content Planner' },
  { value: 'growth_manager', label: 'Growth Manager' },
  { value: 'inside_sales', label: 'Inside Sales' },
  { value: 'field_sales', label: 'Field Sales' },
  { value: 'customer_success', label: 'Customer Success' },
  { value: 'corporate_staff', label: 'Corporate Staff' },
  { value: 'operation_director', label: 'Operation Director' },
  { value: 'ai_director', label: 'AI Director' },
  { value: 'other', label: 'Other' },
];

interface CandidateData {
  id: string;
  token: string;
}

// =====================================================
// Candidate Info Step
// =====================================================
interface CandidateInfoStepProps {
  onSubmit: (name: string, email: string, desiredJobType: string) => void;
  isLoading: boolean;
  error: string | null;
}

function CandidateInfoStep({ onSubmit, isLoading, error }: CandidateInfoStepProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [desiredJobType, setDesiredJobType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSubmit(name.trim(), email.trim(), desiredJobType);
  };

  return (
    <Card data-testid="candidate-info-step" className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">検査を開始する</CardTitle>
        <CardDescription>
          検査を開始する前に、以下の情報をご入力ください
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div
              data-testid="candidate-info-error"
              className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="candidate-name">
              お名前 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="candidate-name"
              data-testid="candidate-name-input"
              type="text"
              placeholder="山田 太郎"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="candidate-email">
              メールアドレス <span className="text-destructive">*</span>
            </Label>
            <Input
              id="candidate-email"
              data-testid="candidate-email-input"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Desired Job Type */}
          <div className="space-y-2">
            <Label htmlFor="desired-job-type">希望職種</Label>
            <Select
              value={desiredJobType}
              onValueChange={setDesiredJobType}
              disabled={isLoading}
            >
              <SelectTrigger
                id="desired-job-type"
                data-testid="desired-job-type-select"
              >
                <SelectValue placeholder="選択してください（任意）" />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            data-testid="submit-candidate-info-button"
            className="w-full"
            disabled={isLoading || !name.trim() || !email.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登録中...
              </>
            ) : (
              <>
                次へ
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            入力された情報は検査にのみ使用されます
          </p>
        </CardContent>
      </form>
    </Card>
  );
}

// =====================================================
// Loading Step
// =====================================================
function LoadingStep() {
  return (
    <Card data-testid="loading-step" className="w-full max-w-md mx-auto">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">準備中...</p>
        <p className="text-sm text-muted-foreground">
          検査の準備をしています。しばらくお待ちください。
        </p>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Assessment Select Step
// =====================================================
interface AssessmentSelectStepProps {
  onSelect: (type: AssessmentType) => void;
  candidateToken: string;
}

function AssessmentSelectStep({ onSelect, candidateToken }: AssessmentSelectStepProps) {
  const router = useRouter();

  const handleGateSelect = () => {
    // Navigate to Gate assessment with token
    router.push(`/assessment/${candidateToken}`);
  };

  const handlePersonalitySelect = () => {
    onSelect('personality');
  };

  return (
    <Card data-testid="assessment-select-step" className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">検査を選択</CardTitle>
        <CardDescription>受験する検査を選択してください</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Gate Assessment */}
          <Card
            data-testid="gate-assessment-option"
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={handleGateSelect}
          >
            <CardHeader>
              <CardTitle className="text-lg">GFD-Gate 適性検査</CardTitle>
              <CardDescription>
                総合的な適性を測定する標準検査です
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>所要時間: 約20分</li>
                <li>全100問</li>
                <li>性格・能力の総合評価</li>
              </ul>
              <Button className="w-full mt-4">
                Gate検査を開始
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Personality Assessment */}
          <Card
            data-testid="personality-assessment-option"
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={handlePersonalitySelect}
          >
            <CardHeader>
              <CardTitle className="text-lg">適職診断</CardTitle>
              <CardDescription>
                パーソナリティに基づく適職診断です
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>所要時間: 約15分</li>
                <li>全67問</li>
                <li>DISC・ストレス耐性・EQ・価値観</li>
              </ul>
              <Button className="w-full mt-4" variant="outline">
                適職診断を開始
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Error State
// =====================================================
interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Card data-testid="direct-assessment-flow-error" className="w-full max-w-md mx-auto">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">エラーが発生しました</h3>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          もう一度試す
        </Button>
      </CardContent>
    </Card>
  );
}

// =====================================================
// Main Component
// =====================================================
export function DirectAssessmentFlow() {
  const [step, setStep] = useState<FlowStep>('candidate-info');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidateData, setCandidateData] = useState<CandidateData | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentType | null>(null);

  // Handle candidate info submission
  const handleCandidateInfoSubmit = useCallback(
    async (name: string, email: string, desiredJobType: string) => {
      setIsLoading(true);
      setError(null);
      setStep('loading');

      try {
        const response = await fetch('/api/candidates/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, desiredJobType }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '登録に失敗しました');
        }

        setCandidateData({ id: data.id, token: data.token });
        setStep('assessment-select');
      } catch (err) {
        setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
        setStep('candidate-info');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Handle assessment type selection
  const handleAssessmentSelect = useCallback((type: AssessmentType) => {
    setSelectedAssessment(type);
    setStep('assessment');
  }, []);

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    setStep('candidate-info');
  }, []);

  // Handle personality assessment submission
  const handlePersonalitySubmit = useCallback(async (responses: Record<string, string>) => {
    if (!candidateData) return;

    // Save personality assessment responses
    const response = await fetch(`/api/assessment/${candidateData.token}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responses }),
    });

    if (!response.ok) {
      throw new Error('検査結果の保存に失敗しました');
    }
  }, [candidateData]);

  // Render based on current step
  return (
    <div data-testid="direct-assessment-flow">
      {step === 'candidate-info' && (
        <CandidateInfoStep
          onSubmit={handleCandidateInfoSubmit}
          isLoading={isLoading}
          error={error}
        />
      )}
      {step === 'loading' && <LoadingStep />}
      {step === 'assessment-select' && candidateData && (
        <AssessmentSelectStep
          onSelect={handleAssessmentSelect}
          candidateToken={candidateData.token}
        />
      )}
      {step === 'assessment' && selectedAssessment === 'personality' && candidateData && (
        <PersonalityAssessment
          candidateId={candidateData.id}
          onSubmit={handlePersonalitySubmit}
        />
      )}
      {error && step !== 'candidate-info' && (
        <ErrorState error={error} onRetry={handleRetry} />
      )}
    </div>
  );
}
