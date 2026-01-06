/**
 * Assessment Factory for E2E Tests
 *
 * テスト用の検査データを作成・更新するファクトリー
 * Admin Clientを使用してRLSをバイパス
 *
 * @see Issue #179 Phase 2: 個別ファクトリー実装
 */

import { createAdminSupabase } from '../helpers/supabase-admin';

/**
 * テスト検査の型定義
 */
export interface TestAssessment {
  id: string;
  token: string;
}

/**
 * 検査トークンを生成
 *
 * 紛らわしい文字（0, O, I, l等）を除外した24文字のトークン
 */
function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * テスト検査を発行
 *
 * @param candidateId - 候補者ID
 * @param organizationId - 組織ID
 * @returns 発行された検査情報（ID、トークン）
 */
export async function issueTestAssessment(
  candidateId: string,
  organizationId: string
): Promise<TestAssessment> {
  const supabase = createAdminSupabase();

  // デフォルトテンプレート取得（存在しない場合はnull）
  const { data: template } = await supabase
    .from('assessment_templates')
    .select('id')
    .eq('organization_id', organizationId)
    .limit(1)
    .maybeSingle();

  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7日間有効

  const { data: assessment, error } = await supabase
    .from('assessments')
    .insert({
      organization_id: organizationId,
      candidate_id: candidateId,
      template_id: template?.id || null,
      token,
      status: 'pending',
      progress: {},
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(
      `[AssessmentFactory] Failed to issue assessment: ${error.message}`
    );
  }

  console.log(
    `[AssessmentFactory] Issued assessment: ${assessment.id} (token: ${token.slice(0, 8)}...)`
  );

  return {
    id: assessment.id,
    token,
  };
}

/**
 * テスト検査を完了状態にする
 *
 * モックの回答データを設定し、ステータスを completed に更新
 *
 * @param assessmentId - 検査ID
 */
export async function completeTestAssessment(
  assessmentId: string
): Promise<void> {
  const supabase = createAdminSupabase();

  // モック回答データ
  const mockResponses = {
    // 基本的な5段階評価の回答
    q1: 4,
    q2: 3,
    q3: 5,
    q4: 4,
    q5: 3,
    q6: 4,
    q7: 5,
    q8: 3,
    q9: 4,
    q10: 4,
  };

  const { error } = await supabase
    .from('assessments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress: {
        completed: true,
        responses: mockResponses,
        completedAt: new Date().toISOString(),
      },
    })
    .eq('id', assessmentId);

  if (error) {
    throw new Error(
      `[AssessmentFactory] Failed to complete assessment: ${error.message}`
    );
  }

  console.log(`[AssessmentFactory] Completed assessment: ${assessmentId}`);
}

/**
 * テスト検査を進行中状態にする
 *
 * @param assessmentId - 検査ID
 * @param progress - 進捗状態（0-100）
 */
export async function updateTestAssessmentProgress(
  assessmentId: string,
  progress: number
): Promise<void> {
  const supabase = createAdminSupabase();

  const { error } = await supabase
    .from('assessments')
    .update({
      status: 'in_progress',
      progress: {
        percentage: progress,
        updatedAt: new Date().toISOString(),
      },
    })
    .eq('id', assessmentId);

  if (error) {
    throw new Error(
      `[AssessmentFactory] Failed to update progress: ${error.message}`
    );
  }

  console.log(
    `[AssessmentFactory] Updated progress: ${assessmentId} (${progress}%)`
  );
}
