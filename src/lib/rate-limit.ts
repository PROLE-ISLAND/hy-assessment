// =====================================================
// Rate Limiting Utility
// Simple in-memory rate limiter for API endpoints
// =====================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (works per serverless instance)
// For production scale, consider Redis or database-backed solution
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  // Maximum requests allowed in the window
  limit: number;
  // Window duration in seconds
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check rate limit for a given identifier (e.g., user ID)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = `rate:${identifier}`;

  let entry = rateLimitStore.get(key);

  // Clean up expired entry or create new one
  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Check if limit exceeded
  if (entry.count >= config.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }

  // Increment count
  entry.count++;

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Apply rate limit headers to response
 */
export function applyRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult
): void {
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(Math.floor(result.resetAt / 1000)));

  if (result.retryAfter !== undefined) {
    headers.set('Retry-After', String(result.retryAfter));
  }
}

// Periodic cleanup to prevent memory leaks (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
