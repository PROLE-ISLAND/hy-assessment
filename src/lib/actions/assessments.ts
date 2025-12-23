'use server';

// =====================================================
// Assessment Server Actions
// Handles assessment creation with email notifications
// =====================================================

import { createAdminClient } from '@/lib/supabase/server';
import { sendAssessmentInvitation } from '@/lib/email';

// =====================================================
// Types
// =====================================================

interface IssueAssessmentInput {
  candidateId: string;
  organizationId: string;
  templateId: string;
}

interface IssueAssessmentResult {
  success: boolean;
  token?: string;
  error?: string;
  emailSent?: boolean;
}

// =====================================================
// Helpers
// =====================================================

function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// =====================================================
// Actions
// =====================================================

/**
 * Issue a new assessment for a candidate
 * Creates assessment record and sends invitation email
 */
export async function issueAssessment(
  input: IssueAssessmentInput
): Promise<IssueAssessmentResult> {
  const { candidateId, organizationId, templateId } = input;

  try {
    const supabase = createAdminClient();

    // Get candidate info for email
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select(`
        id,
        person:persons!inner(
          name,
          email
        )
      `)
      .eq('id', candidateId)
      .eq('organization_id', organizationId)
      .single<{
        id: string;
        person: { name: string; email: string };
      }>();

    if (candidateError || !candidate) {
      return { success: false, error: '候補者が見つかりません' };
    }

    // Get organization name (optional)
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single<{ name: string }>();

    // Calculate expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const token = generateToken();

    // Insert assessment
    const { error: insertError } = await supabase
      .from('assessments')
      .insert({
        organization_id: organizationId,
        candidate_id: candidateId,
        template_id: templateId,
        token,
        status: 'pending',
        progress: {},
        expires_at: expiresAt.toISOString(),
      } as never);

    if (insertError) {
      console.error('Assessment insert error:', insertError);
      return { success: false, error: '検査URLの発行に失敗しました' };
    }

    // Construct assessment URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const assessmentUrl = `${baseUrl}/assessment/${token}`;

    // Extract person data safely
    const person = candidate.person as { name: string; email: string };

    // Send invitation email
    const emailResult = await sendAssessmentInvitation({
      candidateName: person.name,
      candidateEmail: person.email,
      assessmentUrl,
      expiresAt,
      organizationName: organization?.name,
    });

    return {
      success: true,
      token,
      emailSent: emailResult.success,
    };
  } catch (error) {
    console.error('Issue assessment error:', error);
    return { success: false, error: '予期しないエラーが発生しました' };
  }
}
