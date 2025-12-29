// =====================================================
// Assessment Error Boundary Tests
// =====================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AssessmentError from '../error';

describe('AssessmentError', () => {
  const mockReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Error Type Detection', () => {
    it('shows token expired message for expired errors', () => {
      const error = new Error('Token has expired');

      render(<AssessmentError error={error} reset={mockReset} />);

      expect(screen.getByText('検査期限が過ぎています')).toBeInTheDocument();
      expect(screen.getByText(/有効期限が切れました/)).toBeInTheDocument();
      // Should not show retry button for expired tokens
      expect(screen.queryByText('再試行する')).not.toBeInTheDocument();
    });

    it('shows token expired message for Japanese expired errors', () => {
      const error = new Error('期限切れです');

      render(<AssessmentError error={error} reset={mockReset} />);

      expect(screen.getByText('検査期限が過ぎています')).toBeInTheDocument();
    });

    it('shows invalid token message for invalid errors', () => {
      const error = new Error('Invalid token');

      render(<AssessmentError error={error} reset={mockReset} />);

      expect(screen.getByText('無効なリンクです')).toBeInTheDocument();
      expect(screen.getByText(/URLが正しいか/)).toBeInTheDocument();
      // Should not show retry button for invalid tokens
      expect(screen.queryByText('再試行する')).not.toBeInTheDocument();
    });

    it('shows invalid token message for not found errors', () => {
      const error = new Error('Assessment not found');

      render(<AssessmentError error={error} reset={mockReset} />);

      expect(screen.getByText('無効なリンクです')).toBeInTheDocument();
    });

    it('shows server error message for generic errors', () => {
      const error = new Error('Database connection failed');

      render(<AssessmentError error={error} reset={mockReset} />);

      expect(screen.getByText('サーバーエラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText(/一時的な問題が発生/)).toBeInTheDocument();
      // Should show retry button for server errors
      expect(screen.getByText('再試行する')).toBeInTheDocument();
    });

    it('shows server error message for empty error message', () => {
      const error = new Error('');

      render(<AssessmentError error={error} reset={mockReset} />);

      expect(screen.getByText('サーバーエラーが発生しました')).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('calls reset function when retry button is clicked', () => {
      const error = new Error('Server error');

      render(<AssessmentError error={error} reset={mockReset} />);

      const retryButton = screen.getByText('再試行する');
      fireEvent.click(retryButton);

      expect(mockReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Digest Display', () => {
    it('displays error digest when available', () => {
      const error = Object.assign(new Error('Server error'), { digest: 'abc123' });

      render(<AssessmentError error={error} reset={mockReset} />);

      expect(screen.getByText('エラーID: abc123')).toBeInTheDocument();
    });

    it('does not display error ID when digest is not available', () => {
      const error = new Error('Server error');

      render(<AssessmentError error={error} reset={mockReset} />);

      expect(screen.queryByText(/エラーID/)).not.toBeInTheDocument();
    });
  });

  describe('Contact Information', () => {
    it('always shows contact information', () => {
      const error = new Error('Any error');

      render(<AssessmentError error={error} reset={mockReset} />);

      expect(screen.getByText(/担当者にお問い合わせください/)).toBeInTheDocument();
    });
  });

  describe('Error Logging', () => {
    it('logs error to console on mount', () => {
      const error = new Error('Test error');
      const consoleSpy = vi.spyOn(console, 'error');

      render(<AssessmentError error={error} reset={mockReset} />);

      expect(consoleSpy).toHaveBeenCalledWith('Assessment error:', error);
    });
  });
});
