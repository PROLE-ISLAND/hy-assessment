// =====================================================
// Personality Assessment Validation Schemas (Issue #192)
// =====================================================

import { z } from 'zod';

// =====================================================
// DISC Response Schema (24 questions)
// =====================================================

export const discResponseSchema = z.object({
  questionId: z.string().regex(/^disc_\d+$/, 'Invalid DISC question ID'),
  selected: z.enum(['D', 'I', 'S', 'C']),
});

export const discResponsesSchema = z.array(discResponseSchema).length(24, 'DISC requires exactly 24 responses');

// =====================================================
// Likert Response Schema (for Stress and EQ)
// =====================================================

export const likertResponseSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  value: z.number().int().min(1).max(5, 'Value must be between 1 and 5'),
});

// Stress responses (12 questions)
export const stressResponsesSchema = z
  .array(
    z.object({
      questionId: z.string().regex(/^stress_\d+$/, 'Invalid stress question ID'),
      value: z.number().int().min(1).max(5),
    })
  )
  .length(12, 'Stress assessment requires exactly 12 responses');

// EQ responses (16 questions)
export const eqResponsesSchema = z
  .array(
    z.object({
      questionId: z.string().regex(/^eq_\d+$/, 'Invalid EQ question ID'),
      value: z.number().int().min(1).max(5),
    })
  )
  .length(16, 'EQ assessment requires exactly 16 responses');

// =====================================================
// Ranking Response Schema (Values - 15 questions)
// =====================================================

const validValueTypes = ['achievement', 'stability', 'growth', 'socialContribution', 'autonomy'] as const;

export const rankingResponseSchema = z.object({
  questionId: z.string().regex(/^values_\d+$/, 'Invalid values question ID'),
  rankings: z
    .array(z.enum(validValueTypes))
    .length(5, 'Rankings must contain exactly 5 values')
    .refine(
      (arr) => new Set(arr).size === 5,
      'Rankings must not contain duplicates'
    ),
});

export const valuesResponsesSchema = z
  .array(rankingResponseSchema)
  .length(15, 'Values assessment requires exactly 15 responses');

// =====================================================
// Complete Assessment Responses Schema
// =====================================================

export const assessmentResponsesSchema = z.object({
  disc: discResponsesSchema,
  stress: stressResponsesSchema,
  eq: eqResponsesSchema,
  values: valuesResponsesSchema,
});

// =====================================================
// Assessment Submission Schema
// =====================================================

export const personalityAssessmentSubmitSchema = z.object({
  responses: assessmentResponsesSchema,
  durationSeconds: z.number().int().min(0).optional(),
  startedAt: z.string().datetime().optional(),
});

// =====================================================
// Partial Save Schema (for auto-save)
// =====================================================

export const partialAssessmentSaveSchema = z.object({
  disc: z.array(discResponseSchema).optional(),
  stress: z.array(likertResponseSchema).optional(),
  eq: z.array(likertResponseSchema).optional(),
  values: z.array(rankingResponseSchema).optional(),
  currentSection: z.enum(['disc', 'stress', 'eq', 'values']).optional(),
  currentQuestion: z.number().int().min(0).optional(),
});

// =====================================================
// Type Exports
// =====================================================

export type DiscResponse = z.infer<typeof discResponseSchema>;
export type LikertResponse = z.infer<typeof likertResponseSchema>;
export type RankingResponse = z.infer<typeof rankingResponseSchema>;
export type AssessmentResponses = z.infer<typeof assessmentResponsesSchema>;
export type PersonalityAssessmentSubmit = z.infer<typeof personalityAssessmentSubmitSchema>;
export type PartialAssessmentSave = z.infer<typeof partialAssessmentSaveSchema>;
