// =====================================================
// AI Output Validation Schemas
// Zod schemas for validating AI analysis responses
// =====================================================

import { z } from 'zod';

// =====================================================
// Enhanced Analysis Output (v2)
// =====================================================

export const enhancedStrengthSchema = z.object({
  title: z.string().min(1, 'titleは必須です'),
  behavior: z.string().min(1, 'behaviorは必須です'),
  evidence: z.string().min(1, 'evidenceは必須です'),
});

export type EnhancedStrengthInput = z.infer<typeof enhancedStrengthSchema>;

export const enhancedWatchoutSchema = z.object({
  title: z.string().min(1, 'titleは必須です'),
  risk: z.string().min(1, 'riskは必須です'),
  evidence: z.string().min(1, 'evidenceは必須です'),
});

export type EnhancedWatchoutInput = z.infer<typeof enhancedWatchoutSchema>;

export const riskScenarioSchema = z.object({
  condition: z.string().min(1, 'conditionは必須です'),
  symptom: z.string().min(1, 'symptomは必須です'),
  impact: z.string().min(1, 'impactは必須です'),
  prevention: z.string().min(1, 'preventionは必須です'),
  risk_environment: z.array(z.string()).min(1, 'risk_environmentは1つ以上必要です'),
});

export type RiskScenarioInput = z.infer<typeof riskScenarioSchema>;

export const interviewCheckSchema = z.object({
  question: z.string().min(1, 'questionは必須です'),
  intent: z.string().min(1, 'intentは必須です'),
  look_for: z.string().min(1, 'look_forは必須です'),
});

export type InterviewCheckInput = z.infer<typeof interviewCheckSchema>;

export const enhancedAIAnalysisOutputSchema = z.object({
  strengths: z
    .array(enhancedStrengthSchema)
    .min(1, 'strengthsは1つ以上必要です')
    .max(5),
  watchouts: z
    .array(enhancedWatchoutSchema)
    .min(1, 'watchoutsは1つ以上必要です')
    .max(5),
  risk_scenarios: z
    .array(riskScenarioSchema)
    .min(1, 'risk_scenariosは1つ以上必要です')
    .max(4),
  interview_checks: z
    .array(interviewCheckSchema)
    .min(1, 'interview_checksは1つ以上必要です')
    .max(6),
  summary: z.string().min(1, 'summaryは必須です'),
  recommendation: z.string().min(1, 'recommendationは必須です'),
});

export type EnhancedAIAnalysisOutputInput = z.infer<typeof enhancedAIAnalysisOutputSchema>;

// =====================================================
// Legacy Analysis Output (v1)
// =====================================================

export const legacyAIAnalysisOutputSchema = z.object({
  strengths: z
    .array(z.string().min(1))
    .min(1, 'strengthsは1つ以上必要です')
    .max(5),
  weaknesses: z
    .array(z.string().min(1))
    .min(1, 'weaknessesは1つ以上必要です')
    .max(5),
  summary: z.string().min(1, 'summaryは必須です'),
  recommendation: z.string().min(1, 'recommendationは必須です'),
});

export type LegacyAIAnalysisOutputInput = z.infer<typeof legacyAIAnalysisOutputSchema>;

// =====================================================
// Validation Helpers
// =====================================================

/**
 * Validate and parse enhanced AI analysis output with Zod schema
 */
export function validateEnhancedAnalysisOutput(data: unknown) {
  return enhancedAIAnalysisOutputSchema.safeParse(data);
}

/**
 * Validate and parse legacy AI analysis output with Zod schema
 */
export function validateLegacyAnalysisOutput(data: unknown) {
  return legacyAIAnalysisOutputSchema.safeParse(data);
}

/**
 * Format Zod validation errors into a readable message
 */
export function formatValidationErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');
}
