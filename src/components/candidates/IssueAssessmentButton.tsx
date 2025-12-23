'use client';

// =====================================================
// Issue Assessment Button
// Creates a new assessment with unique token and sends email
// =====================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { issueAssessment } from '@/lib/actions/assessments';

interface IssueAssessmentButtonProps {
  candidateId: string;
  organizationId: string;
  templateId?: string;
}

export function IssueAssessmentButton({
  candidateId,
  organizationId,
  templateId,
}: IssueAssessmentButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleIssue = async () => {
    if (!templateId) {
      setError('検査テンプレートが設定されていません');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await issueAssessment({
        candidateId,
        organizationId,
        templateId,
      });

      if (!result.success) {
        setError(result.error || '検査URLの発行に失敗しました');
        return;
      }

      setEmailSent(result.emailSent || false);
      router.refresh();
    } catch (err) {
      setError('予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
      {emailSent && (
        <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-4 w-4" />
          <span>招待メールを送信しました</span>
        </div>
      )}
      <Button onClick={handleIssue} disabled={isLoading || !templateId}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            発行中...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            検査URLを発行・メール送信
          </>
        )}
      </Button>
      {!templateId && (
        <p className="text-xs text-muted-foreground text-center">
          ※ 検査テンプレートを先に作成してください
        </p>
      )}
    </div>
  );
}
