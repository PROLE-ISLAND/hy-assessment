// =====================================================
// API Route Logging Utilities
// Helpers for structured logging in API routes
// =====================================================

import { type NextRequest, NextResponse } from 'next/server';
import { createLogger, type Logger } from './logger';
import { withTraceId, TRACE_ID_HEADER } from './trace';

interface ApiHandlerOptions {
  context: string;
}

type ApiHandler<T> = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; logger: Logger }
) => Promise<NextResponse<T>>;

/**
 * Wrap an API route handler with logging and trace ID support
 */
export function withLogging<T>(
  handler: ApiHandler<T>,
  options: ApiHandlerOptions
) {
  return async (
    request: NextRequest,
    routeContext: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse<T>> => {
    // Extract trace ID from request headers (set by middleware)
    const traceId = request.headers.get(TRACE_ID_HEADER) || 'unknown';

    // Run handler within trace context
    return withTraceId(traceId, async () => {
      const logger = createLogger(options.context);
      const startTime = Date.now();

      // Log request start
      logger.info('Request started', {
        method: request.method,
        path: request.nextUrl.pathname,
        query: Object.fromEntries(request.nextUrl.searchParams),
      });

      try {
        const response = await handler(request, {
          params: routeContext.params,
          logger,
        });

        // Log request completion
        const duration = Date.now() - startTime;
        logger.info('Request completed', {
          method: request.method,
          path: request.nextUrl.pathname,
          status: response.status,
          duration: `${duration}ms`,
        });

        // Add trace ID to response
        response.headers.set(TRACE_ID_HEADER, traceId);

        return response;
      } catch (error) {
        // Log error
        const duration = Date.now() - startTime;
        logger.error('Request failed', error, {
          method: request.method,
          path: request.nextUrl.pathname,
          duration: `${duration}ms`,
        });

        throw error;
      }
    });
  };
}

/**
 * Create a logger for an API route from request headers
 */
export function createApiLogger(request: NextRequest, context: string): Logger {
  const traceId = request.headers.get(TRACE_ID_HEADER);
  if (traceId) {
    // If we have a trace ID, run within that context
    return withTraceId(traceId, () => createLogger(context));
  }
  return createLogger(context);
}

/**
 * Log an API request (standalone version)
 */
export function logApiRequest(
  logger: Logger,
  request: NextRequest,
  meta?: Record<string, unknown>
) {
  logger.info('API request', {
    method: request.method,
    path: request.nextUrl.pathname,
    ...meta,
  });
}

/**
 * Log an API response (standalone version)
 */
export function logApiResponse(
  logger: Logger,
  request: NextRequest,
  status: number,
  duration: number,
  meta?: Record<string, unknown>
) {
  logger.info('API response', {
    method: request.method,
    path: request.nextUrl.pathname,
    status,
    duration: `${duration}ms`,
    ...meta,
  });
}
