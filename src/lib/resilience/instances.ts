// =====================================================
// Pre-configured Circuit Breaker Instances
// Singleton instances for common external services
// =====================================================

import { CircuitBreaker } from './circuit-breaker';

// Lazy initialization to avoid module loading issues

let openAIBreaker: CircuitBreaker | null = null;
let resendBreaker: CircuitBreaker | null = null;

/**
 * Get the OpenAI circuit breaker instance
 *
 * Configuration:
 * - failureThreshold: 5 (higher tolerance for API variability)
 * - recoveryTimeout: 60s (avoid hammering during outages)
 * - requestTimeout: 30s (AI processing can be slow)
 */
export function getOpenAICircuitBreaker(): CircuitBreaker {
  if (!openAIBreaker) {
    openAIBreaker = new CircuitBreaker('openai', {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 60 seconds
      requestTimeout: 30000, // 30 seconds
      successThreshold: 2,
    });
  }
  return openAIBreaker;
}

/**
 * Get the Resend email circuit breaker instance
 *
 * Configuration:
 * - failureThreshold: 3 (faster detection)
 * - recoveryTimeout: 30s
 * - requestTimeout: 10s
 */
export function getResendCircuitBreaker(): CircuitBreaker {
  if (!resendBreaker) {
    resendBreaker = new CircuitBreaker('resend', {
      failureThreshold: 3,
      recoveryTimeout: 30000, // 30 seconds
      requestTimeout: 10000, // 10 seconds
      successThreshold: 2,
    });
  }
  return resendBreaker;
}

/**
 * Reset all circuit breakers (useful for testing)
 */
export function resetAllCircuitBreakers(): void {
  openAIBreaker?.reset();
  resendBreaker?.reset();
}

/**
 * Get all circuit breaker stats
 */
export function getAllCircuitBreakerStats(): Record<
  string,
  ReturnType<CircuitBreaker['getStats']>
> {
  return {
    openai: openAIBreaker?.getStats() ?? {
      state: 'CLOSED' as const,
      failureCount: 0,
      successCount: 0,
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
    },
    resend: resendBreaker?.getStats() ?? {
      state: 'CLOSED' as const,
      failureCount: 0,
      successCount: 0,
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
    },
  };
}
