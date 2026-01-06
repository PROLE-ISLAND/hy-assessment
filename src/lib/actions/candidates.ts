'use server';

// =====================================================
// Candidate Server Actions
// Handles candidate creation with proper RLS bypass
// =====================================================

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =====================================================
// Types
// =====================================================

interface CreateCandidateInput {
  name: string;
  email: string;
  selectedPositions: string[];
  notes: string | null;
  organizationId: string;
}

interface CreateCandidateResult {
  success: boolean;
  candidateId?: string;
  error?: string;
}

// =====================================================
// Actions
// =====================================================

/**
 * Create a new candidate
 * Uses admin client to bypass RLS (since JWT doesn't contain organization_id)
 */
export async function createCandidate(
  input: CreateCandidateInput
): Promise<CreateCandidateResult> {
  const { name, email, selectedPositions, notes, organizationId } = input;

  // Validation
  if (!name || !email) {
    return { success: false, error: '氏名とメールアドレスは必須です' };
  }

  if (selectedPositions.length === 0) {
    return { success: false, error: '希望職種を1つ以上選択してください' };
  }

  try {
    // Verify user is authenticated and belongs to the organization
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();

    if (!user) {
      return { success: false, error: '認証が必要です' };
    }

    // Verify user belongs to the organization
    const { data: userProfile } = await userSupabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single<{ organization_id: string; role: string }>();

    if (!userProfile || userProfile.organization_id !== organizationId) {
      return { success: false, error: '権限がありません' };
    }

    // Only allow admin and recruiter roles to create candidates
    if (!['admin', 'recruiter'].includes(userProfile.role)) {
      return { success: false, error: '候補者を登録する権限がありません' };
    }

    // Use admin client to bypass RLS for the actual insert
    const adminSupabase = createAdminClient();

    // 1. Create person record
    const { data: person, error: personError } = await adminSupabase
      .from('persons')
      .insert({
        organization_id: organizationId,
        name,
        email,
      } as never)
      .select()
      .single<{ id: string }>();

    if (personError) {
      if (personError.code === '23505') {
        return { success: false, error: 'このメールアドレスは既に登録されています' };
      }
      console.error('[createCandidate] Person insert error:', personError);
      return { success: false, error: '登録に失敗しました: ' + personError.message };
    }

    // 2. Create candidate record
    const { data: candidate, error: candidateError } = await adminSupabase
      .from('candidates')
      .insert({
        organization_id: organizationId,
        person_id: person.id,
        position: selectedPositions[0], // For backward compatibility
        desired_positions: selectedPositions,
        notes: notes || null,
      } as never)
      .select()
      .single<{ id: string }>();

    if (candidateError) {
      console.error('[createCandidate] Candidate insert error:', candidateError);
      // Try to clean up the person record
      await adminSupabase.from('persons').delete().eq('id', person.id);
      return { success: false, error: '候補者の登録に失敗しました: ' + candidateError.message };
    }

    // Revalidate the candidates list page
    revalidatePath('/admin/candidates');

    return { success: true, candidateId: candidate.id };
  } catch (error) {
    console.error('[createCandidate] Unexpected error:', error);
    return { success: false, error: '予期しないエラーが発生しました' };
  }
}
