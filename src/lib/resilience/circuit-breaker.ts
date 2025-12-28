// =====================================================
// Circuit Breaker Pattern Implementation
// Protects external API calls from cascading failures
// =====================================================

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  /** Number of failures before circuit opens */
  failureThreshold: number;
  /** Time in ms before attempting recovery */
  recoveryTimeout: number;
  /** Request timeout in ms */
  requestTimeout: number;
  /** Success threshold in HALF_OPEN state to close circuit */
  successThreshold: number;
}

interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

/**
 * Circuit Breaker Error
 * Thrown when circuit is OPEN and request is rejected
 */
export class CircuitOpenError extends Error {
  constructor(
    public readonly circuitName: string,
    public readonly stats: CircuitBreakerStats
  ) {
    super(
      `Circuit breaker "${circuitName}" is OPEN. Last failure: ${stats.lastFailureTime?.toISOString() ?? 'unknown'}`
    );
    this.name = 'CircuitOpenError';
  }
}

/**
 * Circuit Breaker Implementation
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests are rejected immediately
 * - HALF_OPEN: Testing if service recovered, limited requests pass through
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private totalRequests = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;

  private readonly config: CircuitBreakerConfig;
  private readonly name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      recoveryTimeout: config.recoveryTimeout ?? 30000,
      requestTimeout: config.requestTimeout ?? 10000,
      successThreshold: config.successThreshold ?? 2,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN') {
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime > this.config.recoveryTimeout
      ) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        this.log('Transitioning to HALF_OPEN state');
      } else {
        throw new CircuitOpenError(this.name, this.getStats());
      }
    }

    try {
      // Execute with timeout
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Request timeout after ${this.config.requestTimeout}ms`)),
            this.config.requestTimeout
          )
        ),
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.totalSuccesses++;
    this.successCount++;
    this.lastSuccessTime = Date.now();
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      if (this.successCount >= this.config.successThreshold) {
        this.state = 'CLOSED';
        this.log('Transitioning to CLOSED state');
      }
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(): void {
    this.totalFailures++;
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.state === 'HALF_OPEN') {
      // Single failure in HALF_OPEN returns to OPEN
      this.state = 'OPEN';
      this.log('Transitioning to OPEN state (failed in HALF_OPEN)');
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.log('Transitioning to OPEN state (threshold reached)');
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
        ? new Date(this.lastFailureTime)
        : undefined,
      lastSuccessTime: this.lastSuccessTime
        ? new Date(this.lastSuccessTime)
        : undefined,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.log('Circuit breaker reset');
  }

  /**
   * Force circuit to OPEN state (useful for maintenance)
   */
  trip(): void {
    this.state = 'OPEN';
    this.lastFailureTime = Date.now();
    this.log('Circuit breaker manually tripped');
  }

  /**
   * Check if circuit is allowing requests
   */
  isAllowing(): boolean {
    if (this.state === 'OPEN') {
      // Check if we should transition to HALF_OPEN
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime > this.config.recoveryTimeout
      ) {
        return true;
      }
      return false;
    }
    return true;
  }

  private log(message: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CircuitBreaker:${this.name}] ${message}`, {
        state: this.state,
        failureCount: this.failureCount,
        successCount: this.successCount,
      });
    }
  }
}

// Export types
export type { CircuitState, CircuitBreakerConfig, CircuitBreakerStats };
