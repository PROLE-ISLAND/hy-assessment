// =====================================================
// Logging Module Exports
// =====================================================

export { createLogger, logger } from './logger';
export type { Logger, LogEntry, LogLevel } from './logger';

export {
  generateTraceId,
  getTraceId,
  withTraceId,
  withNewTraceId,
  TRACE_ID_HEADER,
} from './trace';

export {
  withLogging,
  createApiLogger,
  logApiRequest,
  logApiResponse,
} from './api-utils';
