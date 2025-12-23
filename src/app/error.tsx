'use client';

// =====================================================
// Global Error Page
// Handles errors at the app level
// =====================================================

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <CardTitle>エラーが発生しました</CardTitle>
              <CardDescription>
                ページの読み込み中に問題が発生しました
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            申し訳ありませんが、予期しないエラーが発生しました。
            再試行するか、ホームに戻ってください。
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-muted p-3 overflow-auto">
              <p className="text-sm font-mono text-muted-foreground break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs font-mono text-muted-foreground/70 mt-1">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={reset} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              再試行
            </Button>
            <Button
              onClick={() => (window.location.href = '/')}
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              ホームに戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
