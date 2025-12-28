// =====================================================
// Email Sending Utilities Tests
// Tests for email retry logic with exponential backoff
// =====================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendAssessmentInvitation,
  sendAssessmentCompletion,
  sendReportLink,
  type AssessmentInvitationData,
  type AssessmentCompletionData,
  type ReportLinkData,
  DEFAULT_RETRY_CONFIG,
} from './send';

// Mock the email client module
vi.mock('./client', () => ({
  isEmailEnabled: vi.fn(() => true),
  resend: {
    emails: {
      send: vi.fn(),
    },
  },
  EMAIL_CONFIG: {
    from: 'test@example.com',
    replyTo: 'reply@example.com',
  },
}));

// Mock the email templates
vi.mock('./templates/assessment-invitation', () => ({
  AssessmentInvitationEmail: vi.fn(() => 'mocked-email'),
}));

vi.mock('./templates/assessment-completion', () => ({
  AssessmentCompletionEmail: vi.fn(() => 'mocked-email'),
}));

vi.mock('./templates/report-link', () => ({
  ReportLinkEmail: vi.fn(() => 'mocked-email'),
}));

// Import mocked modules
import { resend, isEmailEnabled } from './client';

const mockResend = resend as unknown as {
  emails: {
    send: ReturnType<typeof vi.fn>;
  };
};
const mockIsEmailEnabled = isEmailEnabled as ReturnType<typeof vi.fn>;

// Test data
const invitationData: AssessmentInvitationData = {
  candidateName: 'Test User',
  candidateEmail: 'test@example.com',
  assessmentUrl: 'https://example.com/assessment/123',
  expiresAt: new Date('2025-01-01'),
  organizationName: 'Test Org',
};

const completionData: AssessmentCompletionData = {
  adminEmail: 'admin@example.com',
  adminName: 'Admin',
  candidateName: 'Test User',
  candidateEmail: 'test@example.com',
  completedAt: new Date('2025-01-01'),
  detailUrl: 'https://example.com/detail/123',
  analysisStatus: 'completed',
};

const reportLinkData: ReportLinkData = {
  candidateName: 'Test User',
  candidateEmail: 'test@example.com',
  reportUrl: 'https://example.com/report/123',
  expiresAt: new Date('2025-01-01'),
};

// Faster retry config for tests
const testRetryConfig = {
  maxRetries: 3,
  baseDelayMs: 10, // 10ms for faster tests
  maxDelayMs: 100,
};

describe('Email Retry Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockIsEmailEnabled.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('sendAssessmentInvitation', () => {
    it('sends email successfully on first attempt', async () => {
      mockResend.emails.send.mockResolvedValueOnce({
        data: { id: 'msg-123' },
        error: null,
      });

      const result = await sendAssessmentInvitation(invitationData, testRetryConfig);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(mockResend.emails.send).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and succeeds on second attempt', async () => {
      mockResend.emails.send
        .mockResolvedValueOnce({ data: null, error: { message: 'Temporary error' } })
        .mockResolvedValueOnce({ data: { id: 'msg-456' }, error: null });

      const resultPromise = sendAssessmentInvitation(invitationData, testRetryConfig);

      // Advance through the retry delay
      await vi.advanceTimersByTimeAsync(testRetryConfig.baseDelayMs);

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-456');
      expect(mockResend.emails.send).toHaveBeenCalledTimes(2);
    });

    it('fails after all retries exhausted', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'Persistent error' },
      });

      const resultPromise = sendAssessmentInvitation(invitationData, testRetryConfig);

      // Advance through all retry delays
      for (let i = 0; i < testRetryConfig.maxRetries; i++) {
        await vi.advanceTimersByTimeAsync(testRetryConfig.maxDelayMs);
      }

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Persistent error');
      expect(mockResend.emails.send).toHaveBeenCalledTimes(testRetryConfig.maxRetries + 1);
    });

    it('retries on exception and succeeds', async () => {
      mockResend.emails.send
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { id: 'msg-789' }, error: null });

      const resultPromise = sendAssessmentInvitation(invitationData, testRetryConfig);

      await vi.advanceTimersByTimeAsync(testRetryConfig.baseDelayMs);

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-789');
      expect(mockResend.emails.send).toHaveBeenCalledTimes(2);
    });

    it('uses exponential backoff delays', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const customConfig = {
        maxRetries: 2,
        baseDelayMs: 100,
        maxDelayMs: 1000,
      };

      const resultPromise = sendAssessmentInvitation(invitationData, customConfig);

      // First retry: 100ms
      await vi.advanceTimersByTimeAsync(100);
      // Second retry: 200ms (100 * 2^1)
      await vi.advanceTimersByTimeAsync(200);

      await resultPromise;

      expect(mockResend.emails.send).toHaveBeenCalledTimes(3);
    });
  });

  describe('sendAssessmentCompletion', () => {
    it('sends email successfully on first attempt', async () => {
      mockResend.emails.send.mockResolvedValueOnce({
        data: { id: 'msg-completion' },
        error: null,
      });

      const result = await sendAssessmentCompletion(completionData, testRetryConfig);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-completion');
      expect(mockResend.emails.send).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually fails', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      const resultPromise = sendAssessmentCompletion(completionData, testRetryConfig);

      for (let i = 0; i < testRetryConfig.maxRetries; i++) {
        await vi.advanceTimersByTimeAsync(testRetryConfig.maxDelayMs);
      }

      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
      expect(mockResend.emails.send).toHaveBeenCalledTimes(testRetryConfig.maxRetries + 1);
    });
  });

  describe('sendReportLink', () => {
    it('sends email successfully on first attempt', async () => {
      mockResend.emails.send.mockResolvedValueOnce({
        data: { id: 'msg-report' },
        error: null,
      });

      const result = await sendReportLink(reportLinkData, testRetryConfig);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-report');
      expect(mockResend.emails.send).toHaveBeenCalledTimes(1);
    });

    it('retries and succeeds on third attempt', async () => {
      mockResend.emails.send
        .mockResolvedValueOnce({ data: null, error: { message: 'Error 1' } })
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce({ data: { id: 'msg-success' }, error: null });

      const resultPromise = sendReportLink(reportLinkData, testRetryConfig);

      // Advance through retry delays
      await vi.advanceTimersByTimeAsync(testRetryConfig.baseDelayMs); // After first failure
      await vi.advanceTimersByTimeAsync(testRetryConfig.baseDelayMs * 2); // After second failure

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-success');
      expect(mockResend.emails.send).toHaveBeenCalledTimes(3);
    });
  });

  describe('Email disabled', () => {
    it('returns mock success when email is not configured', async () => {
      mockIsEmailEnabled.mockReturnValue(false);

      const result = await sendAssessmentInvitation(invitationData, testRetryConfig);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mock-id');
      expect(mockResend.emails.send).not.toHaveBeenCalled();
    });
  });
});

describe('DEFAULT_RETRY_CONFIG', () => {
  it('has expected default values', () => {
    expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
    expect(DEFAULT_RETRY_CONFIG.baseDelayMs).toBe(1000);
    expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(10000);
  });
});
