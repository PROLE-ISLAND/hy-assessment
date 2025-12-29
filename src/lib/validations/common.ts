// =====================================================
// Common Validation Schemas
// Shared schemas used across the application
// =====================================================

import { z } from 'zod';

// =====================================================
// Basic Types
// =====================================================

/** UUID v4 format */
export const uuidSchema = z.string().uuid('無効なIDです');

/** Email with Japanese error message */
export const emailSchema = z
  .string()
  .min(1, 'メールアドレスは必須です')
  .email('有効なメールアドレスを入力してください');

/** Non-empty string */
export const requiredStringSchema = z
  .string()
  .min(1, 'この項目は必須です');

/** Japanese name (allows hiragana, katakana, kanji, spaces) */
export const nameSchema = z
  .string()
  .min(1, '氏名は必須です')
  .max(100, '氏名は100文字以内で入力してください')
  .regex(
    /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}a-zA-Zー・\s]+$/u,
    '氏名に使用できない文字が含まれています'
  );

/** URL schema */
export const urlSchema = z
  .string()
  .url('有効なURLを入力してください');

// =====================================================
// Pagination
// =====================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

// =====================================================
// Sort & Filter
// =====================================================

export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.from && data.to) {
      return data.from <= data.to;
    }
    return true;
  },
  { message: '開始日は終了日以前である必要があります' }
);

// =====================================================
// API Response Helpers
// =====================================================

export const apiErrorSchema = z.object({
  error: z.string(),
  details: z.record(z.string(), z.string()).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

// =====================================================
// Safe JSON Parsing
// =====================================================

/**
 * Safely parse a JSON string with proper error handling.
 * Returns a discriminated union for type-safe error handling.
 */
export function safeParseJson<T = unknown>(
  jsonString: string,
  fallback?: T
): { success: true; data: T } | { success: false; error: string } {
  try {
    const parsed = JSON.parse(jsonString) as T;
    return { success: true, data: parsed };
  } catch (error) {
    if (fallback !== undefined) {
      return { success: true, data: fallback };
    }
    const message = error instanceof SyntaxError
      ? `JSON構文エラー: ${error.message}`
      : 'JSON解析に失敗しました';
    return { success: false, error: message };
  }
}

/**
 * Safely parse request body JSON with validation.
 * Returns parsed data or null with error message.
 */
export async function parseRequestBody<T>(
  request: Request,
  schema?: z.ZodSchema<T>
): Promise<
  | { success: true; data: T }
  | { success: false; error: string; status: 400 }
> {
  try {
    const body: unknown = await request.json();

    if (schema) {
      const result = schema.safeParse(body);
      if (!result.success) {
        const firstError = result.error.issues[0];
        return {
          success: false,
          error: firstError?.message || 'リクエストボディが不正です',
          status: 400,
        };
      }
      return { success: true, data: result.data };
    }

    return { success: true, data: body as T };
  } catch (error) {
    // request.json() throws SyntaxError for invalid JSON
    const message = error instanceof SyntaxError
      ? 'リクエストボディのJSON形式が不正です'
      : 'リクエストボディの解析に失敗しました';
    return { success: false, error: message, status: 400 };
  }
}

// =====================================================
// Type Helpers
// =====================================================

/** Make all fields optional except specified keys */
export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;

/** Safe parse result wrapper */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  fieldErrors: Record<string, string[]>;
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const fieldErrors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }

  return {
    success: false,
    error: result.error.issues[0]?.message || '入力内容に問題があります',
    fieldErrors,
  };
}
