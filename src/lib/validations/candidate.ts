// =====================================================
// Candidate Validation Schemas
// =====================================================

import { z } from 'zod';
import { emailSchema, nameSchema } from './common';

// =====================================================
// Position Values (sync with constants/positions.ts)
// =====================================================

export const positionValues = [
  'executive',
  'manager',
  'specialist',
  'sales',
  'engineering',
  'support',
  'hr',
  'finance',
  'marketing',
  'other',
] as const;

export const positionSchema = z.enum(positionValues, {
  message: '有効な職種を選択してください',
});

// =====================================================
// Candidate Create Schema
// =====================================================

export const candidateCreateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  desiredPositions: z
    .array(positionSchema)
    .min(1, '希望職種を1つ以上選択してください')
    .max(5, '希望職種は5つまで選択できます'),
  notes: z
    .string()
    .max(1000, '備考は1000文字以内で入力してください')
    .optional()
    .nullable(),
});

export type CandidateCreateInput = z.infer<typeof candidateCreateSchema>;

// =====================================================
// Candidate Update Schema
// =====================================================

export const candidateUpdateSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  desiredPositions: z
    .array(positionSchema)
    .min(1, '希望職種を1つ以上選択してください')
    .max(5, '希望職種は5つまで選択できます')
    .optional(),
  notes: z
    .string()
    .max(1000, '備考は1000文字以内で入力してください')
    .optional()
    .nullable(),
});

export type CandidateUpdateInput = z.infer<typeof candidateUpdateSchema>;

// =====================================================
// Candidate Search Schema
// =====================================================

export const candidateSearchSchema = z.object({
  query: z.string().max(100).optional(),
  status: z.enum(['no_assessment', 'pending', 'in_progress', 'completed', 'analyzed']).optional(),
  positions: z.array(positionSchema).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'created_at', 'status']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CandidateSearchInput = z.infer<typeof candidateSearchSchema>;

// =====================================================
// Validation Helpers
// =====================================================

export function validateCandidateCreate(data: unknown) {
  return candidateCreateSchema.safeParse(data);
}

export function validateCandidateUpdate(data: unknown) {
  return candidateUpdateSchema.safeParse(data);
}
