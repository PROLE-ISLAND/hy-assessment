// =====================================================
// Email Module Exports
// =====================================================

export { resend, EMAIL_CONFIG, isEmailEnabled } from './client';

export {
  sendAssessmentInvitation,
  sendAssessmentCompletion,
  type SendEmailResult,
  type AssessmentInvitationData,
  type AssessmentCompletionData,
} from './send';
