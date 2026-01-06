// =====================================================
// Organization Validation Schemas
// Zod schemas for organization settings
// =====================================================

import { z } from 'zod';

/**
 * 検査設定スキーマ
 */
export const assessmentSettingsSchema = z.object({
  defaultValidityDays: z
    .number()
    .int('有効期限は整数で入力してください')
    .min(1, '有効期限は1日以上を指定してください')
    .max(365, '有効期限は365日以内を指定してください'),
  reminderDays: z
    .array(z.number().int().min(0).max(30))
    .max(5, 'リマインダーは最大5件まで設定できます'),
  autoReminder: z.boolean(),
});

/**
 * 組織設定スキーマ
 */
export const organizationSettingsSchema = z.object({
  assessment: assessmentSettingsSchema,
});

/**
 * 組織名スキーマ
 */
export const organizationNameSchema = z
  .string()
  .min(1, '組織名を入力してください')
  .max(100, '組織名は100文字以内で入力してください')
  .trim();

/**
 * 組織更新リクエストスキーマ
 */
export const updateOrganizationSchema = z.object({
  name: organizationNameSchema.optional(),
  settings: organizationSettingsSchema.partial().optional(),
});

/**
 * 組織削除リクエストスキーマ
 */
export const deleteOrganizationSchema = z.object({
  confirmationName: z.string().min(1, '確認のため組織名を入力してください'),
});

// 型エクスポート
export type AssessmentSettingsInput = z.infer<typeof assessmentSettingsSchema>;
export type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type DeleteOrganizationInput = z.infer<typeof deleteOrganizationSchema>;
