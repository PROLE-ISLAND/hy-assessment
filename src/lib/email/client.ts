// =====================================================
// Email Client Configuration
// Using Resend for transactional emails
// =====================================================

import { Resend } from 'resend';

// Initialize Resend client
// API key should be set in environment variables
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey && process.env.NODE_ENV === 'production') {
  console.warn('RESEND_API_KEY is not set. Emails will not be sent.');
}

// Only create Resend client if API key is available
// This prevents build errors when RESEND_API_KEY is not set
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Default sender configuration
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'HY Assessment <noreply@example.com>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@example.com',
} as const;

// Check if email sending is enabled
export function isEmailEnabled(): boolean {
  return !!resendApiKey && !!resend;
}
