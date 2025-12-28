// =====================================================
// Rate Limit Utility Tests
// Tests for rate limiting functionality
// =====================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit, applyRateLimitHeaders, type RateLimitConfig } from './rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const config: RateLimitConfig = {
    limit: 10,
    windowSeconds: 60,
  };

  it('allows requests under the limit', () => {
    const result = checkRateLimit('user-1', config);

    expect(result.success).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
    expect(result.retryAfter).toBeUndefined();
  });

  it('tracks request count correctly', () => {
    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      checkRateLimit('user-2', config);
    }

    const result = checkRateLimit('user-2', config);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4); // 10 - 6 = 4
  });

  it('blocks requests over the limit', () => {
    // Exhaust the limit
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user-3', config);
    }

    const result = checkRateLimit('user-3', config);

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('resets after window expires', () => {
    // Exhaust the limit
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user-4', config);
    }

    // Verify blocked
    expect(checkRateLimit('user-4', config).success).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(61 * 1000);

    // Should be allowed again
    const result = checkRateLimit('user-4', config);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it('isolates different users', () => {
    // Exhaust limit for user-5
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user-5', config);
    }

    // user-5 is blocked
    expect(checkRateLimit('user-5', config).success).toBe(false);

    // user-6 should still be allowed
    const result = checkRateLimit('user-6', config);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it('returns correct retryAfter value', () => {
    // Exhaust the limit
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user-7', config);
    }

    // Advance time by 30 seconds
    vi.advanceTimersByTime(30 * 1000);

    const result = checkRateLimit('user-7', config);
    expect(result.success).toBe(false);
    // Should be about 30 seconds remaining
    expect(result.retryAfter).toBeLessThanOrEqual(30);
    expect(result.retryAfter).toBeGreaterThan(0);
  });
});

describe('applyRateLimitHeaders', () => {
  it('sets rate limit headers correctly', () => {
    const headers = new Headers();
    const result = {
      success: true,
      limit: 10,
      remaining: 5,
      resetAt: 1700000000000,
    };

    applyRateLimitHeaders(headers, result);

    expect(headers.get('X-RateLimit-Limit')).toBe('10');
    expect(headers.get('X-RateLimit-Remaining')).toBe('5');
    expect(headers.get('X-RateLimit-Reset')).toBe('1700000000');
    expect(headers.get('Retry-After')).toBeNull();
  });

  it('includes Retry-After header when provided', () => {
    const headers = new Headers();
    const result = {
      success: false,
      limit: 10,
      remaining: 0,
      resetAt: 1700000000000,
      retryAfter: 30,
    };

    applyRateLimitHeaders(headers, result);

    expect(headers.get('Retry-After')).toBe('30');
  });
});
