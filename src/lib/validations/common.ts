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
