// =====================================================
// Job Types Validation Schemas (Issue #192)
// =====================================================

import { z } from 'zod';

// スコア（0-100）のスキーマ
const scoreSchema = z.number().int().min(0).max(100).optional().nullable();

// 重み（0.0-1.0）のスキーマ
const weightSchema = z.number().min(0).max(1).default(0.5);

// ストレスリスクレベルのスキーマ
const stressRiskLevelSchema = z.enum(['low', 'medium', 'high']).default('medium');

/**
 * 職種作成入力スキーマ
 */
export const jobTypeCreateSchema = z.object({
  name: z.string().min(1, '職種名は必須です').max(100, '職種名は100文字以内で入力してください'),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').optional().nullable(),
  // DISC理想プロファイル
  ideal_dominance: scoreSchema,
  weight_dominance: weightSchema,
  ideal_influence: scoreSchema,
  weight_influence: weightSchema,
  ideal_steadiness: scoreSchema,
  weight_steadiness: weightSchema,
  ideal_conscientiousness: scoreSchema,
  weight_conscientiousness: weightSchema,
  // ストレス耐性理想プロファイル
  ideal_stress: scoreSchema,
  weight_stress: weightSchema,
  max_stress_risk: stressRiskLevelSchema,
  // EQ理想プロファイル
  ideal_eq: scoreSchema,
  weight_eq: weightSchema,
  // 価値観理想プロファイル
  ideal_achievement: scoreSchema,
  weight_achievement: z.number().min(0).max(1).default(0.2),
  ideal_stability: scoreSchema,
  weight_stability: z.number().min(0).max(1).default(0.2),
  ideal_growth: scoreSchema,
  weight_growth: z.number().min(0).max(1).default(0.2),
  ideal_social_contribution: scoreSchema,
  weight_social_contribution: z.number().min(0).max(1).default(0.2),
  ideal_autonomy: scoreSchema,
  weight_autonomy: z.number().min(0).max(1).default(0.2),
  // メタデータ
  is_active: z.boolean().default(true),
});

/**
 * 職種更新入力スキーマ（全フィールドoptional）
 */
export const jobTypeUpdateSchema = jobTypeCreateSchema.partial();

/**
 * 職種一覧取得クエリパラメータスキーマ
 */
export const jobTypeListQuerySchema = z.object({
  includeInactive: z.string().optional().transform((val) => val === 'true'),
});

// 型エクスポート
export type JobTypeCreateInput = z.infer<typeof jobTypeCreateSchema>;
export type JobTypeUpdateInput = z.infer<typeof jobTypeUpdateSchema>;
export type JobTypeListQuery = z.infer<typeof jobTypeListQuerySchema>;
