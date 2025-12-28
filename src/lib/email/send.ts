// =====================================================
// Email Sending Utilities
// Helper functions for sending emails via Resend
// With exponential backoff retry logic
// =====================================================

import { resend, EMAIL_CONFIG, isEmailEnabled } from './client';
import { AssessmentInvitationEmail } from './templates/assessment-invitation';
import { AssessmentCompletionEmail } from './templates/assessment-completion';
import { ReportLinkEmail } from './templates/report-link';

// =====================================================
// Retry Configuration
// =====================================================

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000, // 1 second
  maxDelayMs: 10000, // 10 seconds cap
};

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 * Attempt 0: 1000ms, Attempt 1: 2000ms, Attempt 2: 4000ms, etc.
 */
function getBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, config.maxDelayMs);
}

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
 * With exponential backoff retry (max 3 retries)
 */
export async function sendAssessmentInvitation(
  data: AssessmentInvitationData,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<SendEmailResult> {
  if (!isEmailEnabled() || !resend) {
    console.log('[Email] Skipping send - email not configured');
    console.log('[Email] Would send invitation to:', data.candidateEmail);
    return { success: true, messageId: 'mock-id' };
  }

  const context = `Invitation to ${data.candidateEmail}`;
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
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
        lastError = result.error.message;
        if (attempt < retryConfig.maxRetries) {
          const delay = getBackoffDelay(attempt, retryConfig);
          console.warn(
            `[Email] ${context} failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}): ${lastError}, ` +
            `retrying in ${delay}ms...`
          );
          await sleep(delay);
          continue;
        }
      } else {
        console.log('[Email] Invitation sent:', result.data?.id);
        return { success: true, messageId: result.data?.id };
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      if (attempt < retryConfig.maxRetries) {
        const delay = getBackoffDelay(attempt, retryConfig);
        console.warn(
          `[Email] ${context} error (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}): ${lastError}, ` +
          `retrying in ${delay}ms...`
        );
        await sleep(delay);
        continue;
      }
    }
  }

  console.error(
    `[Email] ${context} failed after ${retryConfig.maxRetries + 1} attempts: ${lastError}`
  );
  return { success: false, error: lastError };
}

/**
 * Send assessment completion notification to admin
 * With exponential backoff retry (max 3 retries)
 */
export async function sendAssessmentCompletion(
  data: AssessmentCompletionData,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<SendEmailResult> {
  if (!isEmailEnabled() || !resend) {
    console.log('[Email] Skipping send - email not configured');
    console.log('[Email] Would send completion to:', data.adminEmail);
    return { success: true, messageId: 'mock-id' };
  }

  const context = `Completion notification to ${data.adminEmail}`;
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
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
        lastError = result.error.message;
        if (attempt < retryConfig.maxRetries) {
          const delay = getBackoffDelay(attempt, retryConfig);
          console.warn(
            `[Email] ${context} failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}): ${lastError}, ` +
            `retrying in ${delay}ms...`
          );
          await sleep(delay);
          continue;
        }
      } else {
        console.log('[Email] Completion notification sent:', result.data?.id);
        return { success: true, messageId: result.data?.id };
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      if (attempt < retryConfig.maxRetries) {
        const delay = getBackoffDelay(attempt, retryConfig);
        console.warn(
          `[Email] ${context} error (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}): ${lastError}, ` +
          `retrying in ${delay}ms...`
        );
        await sleep(delay);
        continue;
      }
    }
  }

  console.error(
    `[Email] ${context} failed after ${retryConfig.maxRetries + 1} attempts: ${lastError}`
  );
  return { success: false, error: lastError };
}

/**
 * Send report link email to candidate
 * With exponential backoff retry (max 3 retries)
 */
export async function sendReportLink(
  data: ReportLinkData,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<SendEmailResult> {
  if (!isEmailEnabled() || !resend) {
    console.log('[Email] Skipping send - email not configured');
    console.log('[Email] Would send report link to:', data.candidateEmail);
    return { success: true, messageId: 'mock-id' };
  }

  const context = `Report link to ${data.candidateEmail}`;
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
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
        lastError = result.error.message;
        if (attempt < retryConfig.maxRetries) {
          const delay = getBackoffDelay(attempt, retryConfig);
          console.warn(
            `[Email] ${context} failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}): ${lastError}, ` +
            `retrying in ${delay}ms...`
          );
          await sleep(delay);
          continue;
        }
      } else {
        console.log('[Email] Report link sent:', result.data?.id);
        return { success: true, messageId: result.data?.id };
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      if (attempt < retryConfig.maxRetries) {
        const delay = getBackoffDelay(attempt, retryConfig);
        console.warn(
          `[Email] ${context} error (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}): ${lastError}, ` +
          `retrying in ${delay}ms...`
        );
        await sleep(delay);
        continue;
      }
    }
  }

  console.error(
    `[Email] ${context} failed after ${retryConfig.maxRetries + 1} attempts: ${lastError}`
  );
  return { success: false, error: lastError };
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
