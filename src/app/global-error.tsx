'use client';

// =====================================================
// Global Error Handler
// Catches errors in root layout (App Router)
// Integrated with Sentry for error tracking
// =====================================================

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Send error to Sentry
    Sentry.captureException(error, {
      tags: {
        errorType: 'global',
      },
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <html lang="ja">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/20">
                <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  予期しないエラーが発生しました
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  システムエラーが発生しました
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 rounded-md bg-gray-100 dark:bg-gray-800 p-3">
                <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                再試行
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                トップページへ
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
