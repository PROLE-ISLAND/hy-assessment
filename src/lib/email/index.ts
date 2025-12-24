// =====================================================
// Email Module Exports
// =====================================================

export { resend, EMAIL_CONFIG, isEmailEnabled } from './client';

export {
  sendAssessmentInvitation,
  sendAssessmentCompletion,
  sendReportLink,
  type SendEmailResult,
  type AssessmentInvitationData,
  type AssessmentCompletionData,
  type ReportLinkData,
} from './send';
