// =====================================================
// API Error Handler with Sentry Integration
// Utility for consistent error handling in API routes
// =====================================================

import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

interface ApiErrorOptions {
  /** User-facing error message */
  message: string;
  /** HTTP status code */
  status: number;
  /** Additional context for Sentry */
  context?: Record<string, unknown>;
  /** Tags for Sentry filtering */
  tags?: Record<string, string>;
}

/**
 * Capture and report API errors to Sentry
 * Returns a standardized error response
 */
export function handleApiError(
  error: unknown,
  options: ApiErrorOptions
): NextResponse<{ error: string; code?: string }> {
  const { message, status, context = {}, tags = {} } = options;

  // Capture error in Sentry
  Sentry.withScope((scope) => {
    // Add context
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });

    // Add tags
    scope.setTag('api.error', 'true');
    scope.setTag('api.status', String(status));
    Object.entries(tags).forEach(([key, value]) => {
      scope.setTag(key, value);
    });

    // Capture the exception
    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error), 'error');
    }
  });

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[API Error]', { error, ...options });
  }

  // Return standardized error response
  return NextResponse.json(
    {
      error: message,
      code: error instanceof Error ? error.name : undefined,
    },
    { status }
  );
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<NextResponse<R>>,
  options?: {
    defaultErrorMessage?: string;
    tags?: Record<string, string>;
  }
) {
  return async (...args: T): Promise<NextResponse<R | { error: string }>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, {
        message:
          options?.defaultErrorMessage ?? '処理中にエラーが発生しました',
        status: 500,
        tags: options?.tags,
      });
    }
  };
}

/**
 * Log a non-error event to Sentry
 */
export function logToSentry(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  extra?: Record<string, unknown>
) {
  Sentry.withScope((scope) => {
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureMessage(message, level);
  });
}
