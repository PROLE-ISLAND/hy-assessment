// =====================================================
// Request Trace ID Management
// Provides request-scoped trace IDs for log correlation
// =====================================================

import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

// AsyncLocalStorage for trace context
const traceStorage = new AsyncLocalStorage<string>();

/**
 * Generate a new trace ID
 */
export function generateTraceId(): string {
  return randomUUID();
}

/**
 * Get the current trace ID from async context
 * Returns undefined if not in a traced context
 */
export function getTraceId(): string | undefined {
  return traceStorage.getStore();
}

/**
 * Run a function with a trace ID context
 * All async operations within will have access to the trace ID
 */
export function withTraceId<T>(traceId: string, fn: () => T): T {
  return traceStorage.run(traceId, fn);
}

/**
 * Run a function with a new trace ID
 * Convenience wrapper that generates and sets a trace ID
 */
export function withNewTraceId<T>(fn: () => T): T {
  return withTraceId(generateTraceId(), fn);
}

// Header name for trace ID propagation
export const TRACE_ID_HEADER = 'x-trace-id';
