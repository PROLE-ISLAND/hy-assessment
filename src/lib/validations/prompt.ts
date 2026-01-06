// =====================================================
// Prompt Template Validation Schemas
// Used for prompt management API
// =====================================================

import { z } from 'zod';

// =====================================================
// Prompt Key Enum
// =====================================================

export const promptKeySchema = z.enum(['system', 'analysis_user', 'judgment', 'candidate']);

// =====================================================
// Update Prompt Schema (PUT /api/prompts/[id])
// =====================================================

export const updatePromptSchema = z.object({
  content: z
    .string()
    .min(1, 'プロンプト内容は必須です')
    .max(50000, 'プロンプト内容は50,000文字以内で入力してください'),
  change_summary: z
    .string()
    .max(500, '変更概要は500文字以内で入力してください')
    .optional()
    .nullable(),
  model: z
    .string()
    .min(1, 'モデルは必須です')
    .max(50, 'モデル名は50文字以内で入力してください')
    .optional(),
  temperature: z
    .number()
    .min(0, '温度は0以上である必要があります')
    .max(2, '温度は2以下である必要があります')
    .optional(),
  max_tokens: z
    .number()
    .int('最大トークン数は整数である必要があります')
    .min(1, '最大トークン数は1以上である必要があります')
    .max(128000, '最大トークン数は128,000以下である必要があります')
    .optional(),
});

export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;

// =====================================================
// Revert Prompt Schema (POST /api/prompts/[id]/versions/[version]/revert)
// =====================================================

export const revertPromptSchema = z.object({
  version: z
    .string()
    .regex(/^v\d+\.\d+\.\d+$/, 'バージョンはv1.0.0形式である必要があります'),
});

export type RevertPromptInput = z.infer<typeof revertPromptSchema>;
