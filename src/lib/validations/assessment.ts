// =====================================================
// Assessment Validation Schemas
// =====================================================

import { z } from 'zod';
import { uuidSchema } from './common';

// =====================================================
// Assessment Status
// =====================================================

export const assessmentStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'expired',
]);

export type AssessmentStatusInput = z.infer<typeof assessmentStatusSchema>;

// =====================================================
// Assessment Token
// Token format: 24 chars, alphanumeric (excluding ambiguous chars)
// =====================================================

export const assessmentTokenSchema = z
  .string()
  .length(24, 'トークンは24文字である必要があります')
  .regex(
    /^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789]+$/,
    '無効なトークン形式です'
  );

// =====================================================
// Issue Assessment Schema
// =====================================================

export const issueAssessmentSchema = z.object({
  candidateId: uuidSchema,
  templateId: uuidSchema,
  expiresInDays: z
    .coerce.number()
    .int()
    .min(1, '有効期限は1日以上必要です')
    .max(30, '有効期限は30日以内に設定してください')
    .default(7),
});

export type IssueAssessmentInput = z.infer<typeof issueAssessmentSchema>;

// =====================================================
// Assessment Response Schema
// For saving survey responses
// =====================================================

export const likertResponseSchema = z.object({
  questionId: z.string().regex(/^L\d{2}$/, '無効な設問IDです'),
  answer: z.number().int().min(1).max(5),
});

export const sjtResponseSchema = z.object({
  questionId: z.string().regex(/^SJT\d{2}$/, '無効な設問IDです'),
  answer: z.enum(['A', 'B', 'C', 'D']),
});

export const assessmentResponseSchema = z.object({
  responses: z.array(
    z.union([likertResponseSchema, sjtResponseSchema])
  ).min(1, '回答が必要です'),
  currentPage: z.number().int().min(0).optional(),
});

export type AssessmentResponseInput = z.infer<typeof assessmentResponseSchema>;

// =====================================================
// Assessment Progress Schema
// =====================================================

export const assessmentProgressSchema = z.object({
  currentPage: z.number().int().min(0),
  answeredCount: z.number().int().min(0).optional(),
  totalQuestions: z.number().int().min(1).optional(),
});

export type AssessmentProgressInput = z.infer<typeof assessmentProgressSchema>;

// =====================================================
// Complete Assessment Schema
// =====================================================

export const completeAssessmentSchema = z.object({
  token: assessmentTokenSchema,
});

export type CompleteAssessmentInput = z.infer<typeof completeAssessmentSchema>;

// =====================================================
// Analysis Request Schema
// =====================================================

export const analysisRequestSchema = z.object({
  assessmentId: uuidSchema,
  forceReanalyze: z.boolean().default(false),
});

export type AnalysisRequestInput = z.infer<typeof analysisRequestSchema>;

// =====================================================
// Validation Helpers
// =====================================================

export function validateToken(token: unknown) {
  return assessmentTokenSchema.safeParse(token);
}

export function validateAssessmentResponse(data: unknown) {
  return assessmentResponseSchema.safeParse(data);
}
