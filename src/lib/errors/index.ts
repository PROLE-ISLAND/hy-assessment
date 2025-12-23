// =====================================================
// Error Handling Utilities
// Centralized error types and handling
// =====================================================

import { NextResponse } from 'next/server';

// =====================================================
// Custom Error Classes
// =====================================================

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'リソース') {
    super(`${resource}が見つかりません`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '認証が必要です') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'アクセス権限がありません') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('リクエスト制限を超えました。しばらくしてからお試しください', 'RATE_LIMIT', 429, {
      retryAfter,
    });
    this.name = 'RateLimitError';
  }
}

// =====================================================
// Error Response Helpers
// =====================================================

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
}

export function createErrorResponse(error: unknown): NextResponse<ErrorResponse> {
  // Handle known errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    console.error('Unhandled error:', error);
    return NextResponse.json(
      {
        error: {
          message: 'サーバーエラーが発生しました',
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  console.error('Unknown error:', error);
  return NextResponse.json(
    {
      error: {
        message: '予期しないエラーが発生しました',
        code: 'UNKNOWN_ERROR',
      },
    },
    { status: 500 }
  );
}

// =====================================================
// Error Handling Wrapper
// =====================================================

type AsyncHandler<T> = () => Promise<T>;

export async function handleAsync<T>(
  fn: AsyncHandler<T>,
  errorMessage?: string
): Promise<{ data: T; error: null } | { data: null; error: AppError }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    if (error instanceof AppError) {
      return { data: null, error };
    }
    return {
      data: null,
      error: new AppError(
        errorMessage || (error instanceof Error ? error.message : '処理中にエラーが発生しました'),
        'UNKNOWN_ERROR',
        500
      ),
    };
  }
}

// =====================================================
// User-Friendly Error Messages
// =====================================================

const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください',
  TIMEOUT: 'リクエストがタイムアウトしました。再度お試しください',

  // Auth errors
  INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません',
  SESSION_EXPIRED: 'セッションが期限切れです。再度ログインしてください',

  // Validation errors
  INVALID_EMAIL: '有効なメールアドレスを入力してください',
  REQUIRED_FIELD: '必須項目を入力してください',

  // Business errors
  ASSESSMENT_EXPIRED: '検査の有効期限が切れています',
  ASSESSMENT_COMPLETED: '検査は既に完了しています',
  DUPLICATE_EMAIL: 'このメールアドレスは既に登録されています',
};

export function getUserFriendlyMessage(code: string, fallback?: string): string {
  return ERROR_MESSAGES[code] || fallback || 'エラーが発生しました';
}

// =====================================================
// Supabase Error Handler
// =====================================================

export function handleSupabaseError(error: unknown): AppError {
  if (!error || typeof error !== 'object') {
    return new AppError('データベースエラー', 'DATABASE_ERROR', 500);
  }

  const err = error as { code?: string; message?: string };

  // PostgreSQL error codes
  if (err.code === '23505') {
    return new ConflictError('このデータは既に登録されています');
  }

  if (err.code === '23503') {
    return new ValidationError('関連するデータが見つかりません');
  }

  if (err.code === 'PGRST116') {
    return new NotFoundError('データ');
  }

  return new AppError(
    err.message || 'データベースエラーが発生しました',
    'DATABASE_ERROR',
    500
  );
}
