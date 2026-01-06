/**
 * Candidate Factory for E2E Tests
 *
 * テスト用の候補者データを作成・削除するファクトリー
 * Admin Clientを使用してRLSをバイパス
 *
 * @see Issue #179 Phase 2: 個別ファクトリー実装
 */

import { createAdminSupabase } from '../helpers/supabase-admin';

/**
 * テスト候補者の型定義
 */
export interface TestCandidate {
  id: string;
  personId: string;
  name: string;
  email: string;
}

/**
 * テスト候補者作成オプション
 */
export interface CreateTestCandidateOptions {
  name?: string;
  email?: string;
  position?: string;
  desiredPositions?: string[];
}

/**
 * テスト候補者を作成
 *
 * PersonとCandidateの両方を作成し、関連付ける
 *
 * @param organizationId - 組織ID
 * @param options - オプション（名前、メール等）
 * @returns 作成された候補者情報
 */
export async function createTestCandidate(
  organizationId: string,
  options?: CreateTestCandidateOptions
): Promise<TestCandidate> {
  const supabase = createAdminSupabase();
  const timestamp = Date.now();

  const name = options?.name || `E2E Test ${timestamp}`;
  const email = options?.email || `e2e-${timestamp}@test.local`;
  const position = options?.position || 'E2E Test Position';
  const desiredPositions = options?.desiredPositions || ['account_manager'];

  // 1. Person作成
  const { data: person, error: personError } = await supabase
    .from('persons')
    .insert({
      organization_id: organizationId,
      name,
      email,
    })
    .select('id')
    .single();

  if (personError) {
    throw new Error(
      `[CandidateFactory] Failed to create person: ${personError.message}`
    );
  }

  // 2. Candidate作成
  const { data: candidate, error: candidateError } = await supabase
    .from('candidates')
    .insert({
      organization_id: organizationId,
      person_id: person.id,
      position,
      desired_positions: desiredPositions,
    })
    .select('id')
    .single();

  if (candidateError) {
    throw new Error(
      `[CandidateFactory] Failed to create candidate: ${candidateError.message}`
    );
  }

  console.log(
    `[CandidateFactory] Created candidate: ${candidate.id} (person: ${person.id})`
  );

  return {
    id: candidate.id,
    personId: person.id,
    name,
    email,
  };
}

/**
 * テスト候補者を削除（ソフトデリート）
 *
 * @param candidateId - 削除する候補者ID
 */
export async function deleteTestCandidate(candidateId: string): Promise<void> {
  const supabase = createAdminSupabase();

  const { error } = await supabase
    .from('candidates')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', candidateId);

  if (error) {
    console.warn(
      `[CandidateFactory] Warning: Failed to delete candidate ${candidateId}: ${error.message}`
    );
    return;
  }

  console.log(`[CandidateFactory] Deleted candidate: ${candidateId}`);
}
