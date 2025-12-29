// =====================================================
// Assessment Error Boundary
// User-friendly error page for assessment-related errors
// Handles token expiration, invalid tokens, and server errors
// =====================================================

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, RefreshCw, HelpCircle } from 'lucide-react';

// Error types that can be identified from error messages
type ErrorType = 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'SERVER_ERROR';

interface ErrorConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  showRetry: boolean;
}

const errorConfigs: Record<ErrorType, ErrorConfig> = {
  TOKEN_EXPIRED: {
    icon: <Clock className="h-12 w-12 text-amber-500" />,
    title: '検査期限が過ぎています',
    description: 'この検査リンクの有効期限が切れました。新しいリンクの発行については、担当者にお問い合わせください。',
    showRetry: false,
  },
  TOKEN_INVALID: {
    icon: <AlertCircle className="h-12 w-12 text-rose-500" />,
    title: '無効なリンクです',
    description: 'このリンクは無効です。URLが正しいかご確認ください。問題が続く場合は担当者にお問い合わせください。',
    showRetry: false,
  },
  SERVER_ERROR: {
    icon: <AlertCircle className="h-12 w-12 text-rose-500" />,
    title: 'サーバーエラーが発生しました',
    description: '一時的な問題が発生しました。しばらく待ってから再度お試しください。',
    showRetry: true,
  },
};

function detectErrorType(error: Error): ErrorType {
  const message = error.message?.toLowerCase() || '';

  if (message.includes('expired') || message.includes('期限')) {
    return 'TOKEN_EXPIRED';
  }
  if (message.includes('invalid') || message.includes('not found') || message.includes('無効')) {
    return 'TOKEN_INVALID';
  }
  return 'SERVER_ERROR';
}

interface AssessmentErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AssessmentError({ error, reset }: AssessmentErrorProps) {
  useEffect(() => {
    // Log error for debugging (could be sent to error tracking service)
    console.error('Assessment error:', error);
  }, [error]);

  const errorType = detectErrorType(error);
  const config = errorConfigs[errorType];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            {config.icon}
          </div>
          <CardTitle className="text-xl">{config.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {config.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.showRetry && (
            <Button onClick={reset} className="w-full" variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              再試行する
            </Button>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <HelpCircle className="h-4 w-4" />
            <span>問題が解決しない場合は担当者にお問い合わせください</span>
          </div>

          {error.digest && (
            <p className="text-xs text-muted-foreground">
              エラーID: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
