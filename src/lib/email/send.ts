// =====================================================
// Email Sending Utilities
// Helper functions for sending emails via Resend
// =====================================================

import { resend, EMAIL_CONFIG, isEmailEnabled } from './client';
import { AssessmentInvitationEmail } from './templates/assessment-invitation';
import { AssessmentCompletionEmail } from './templates/assessment-completion';
import { ReportLinkEmail } from './templates/report-link';

// =====================================================
// Types
// =====================================================

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface AssessmentInvitationData {
  candidateName: string;
  candidateEmail: string;
  assessmentUrl: string;
  expiresAt: Date;
  organizationName?: string;
}

export interface AssessmentCompletionData {
  adminEmail: string;
  adminName?: string;
  candidateName: string;
  candidateEmail: string;
  completedAt: Date;
  detailUrl: string;
  analysisStatus: 'pending' | 'completed' | 'failed';
}

export interface ReportLinkData {
  candidateName: string;
  candidateEmail: string;
  reportUrl: string;
  expiresAt: Date;
}

// =====================================================
// Email Sending Functions
// =====================================================

/**
 * Send assessment invitation email to candidate
 */
export async function sendAssessmentInvitation(
  data: AssessmentInvitationData
): Promise<SendEmailResult> {
  if (!isEmailEnabled() || !resend) {
    console.log('[Email] Skipping send - email not configured');
    console.log('[Email] Would send invitation to:', data.candidateEmail);
    return { success: true, messageId: 'mock-id' };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.candidateEmail,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: '【適性検査】受検のご案内',
      react: AssessmentInvitationEmail({
        candidateName: data.candidateName,
        assessmentUrl: data.assessmentUrl,
        expiresAt: formatDateTime(data.expiresAt),
        organizationName: data.organizationName,
      }),
    });

    if (result.error) {
      console.error('[Email] Send failed:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('[Email] Invitation sent:', result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[Email] Send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send assessment completion notification to admin
 */
export async function sendAssessmentCompletion(
  data: AssessmentCompletionData
): Promise<SendEmailResult> {
  if (!isEmailEnabled() || !resend) {
    console.log('[Email] Skipping send - email not configured');
    console.log('[Email] Would send completion to:', data.adminEmail);
    return { success: true, messageId: 'mock-id' };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.adminEmail,
      subject: `【検査完了】${data.candidateName} 様の適性検査が完了しました`,
      react: AssessmentCompletionEmail({
        adminName: data.adminName,
        candidateName: data.candidateName,
        candidateEmail: data.candidateEmail,
        completedAt: formatDateTime(data.completedAt),
        detailUrl: data.detailUrl,
        analysisStatus: data.analysisStatus,
      }),
    });

    if (result.error) {
      console.error('[Email] Send failed:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('[Email] Completion notification sent:', result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[Email] Send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send report link email to candidate
 */
export async function sendReportLink(
  data: ReportLinkData
): Promise<SendEmailResult> {
  if (!isEmailEnabled() || !resend) {
    console.log('[Email] Skipping send - email not configured');
    console.log('[Email] Would send report link to:', data.candidateEmail);
    return { success: true, messageId: 'mock-id' };
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: data.candidateEmail,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: '【適性検査】レポートのご案内',
      react: ReportLinkEmail({
        candidateName: data.candidateName,
        reportUrl: data.reportUrl,
        expiresAt: formatDateTime(data.expiresAt),
      }),
    });

    if (result.error) {
      console.error('[Email] Send failed:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('[Email] Report link sent:', result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[Email] Send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =====================================================
// Helper Functions
// =====================================================

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(date);
}
