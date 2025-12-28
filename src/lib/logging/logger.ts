// =====================================================
// Structured Logger
// JSON-formatted logging with context and trace support
// =====================================================

import { getTraceId } from './trace';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  traceId?: string;
  meta?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface Logger {
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (
    message: string,
    error?: Error | unknown,
    meta?: Record<string, unknown>
  ) => void;
}

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Log levels for filtering
const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Minimum log level from environment
const MIN_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'INFO';

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  if (isDevelopment) {
    // Pretty print for development
    const { timestamp, level, context, message, traceId, meta, error } = entry;
    const levelColors: Record<LogLevel, string> = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m', // Green
      WARN: '\x1b[33m', // Yellow
      ERROR: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    const color = levelColors[level];

    let output = `${timestamp} ${color}[${level}]${reset} [${context}]`;
    if (traceId) {
      output += ` [trace:${traceId.slice(0, 8)}]`;
    }
    output += ` ${message}`;

    if (meta && Object.keys(meta).length > 0) {
      output += `\n  ${JSON.stringify(meta, null, 2).replace(/\n/g, '\n  ')}`;
    }

    if (error) {
      output += `\n  Error: ${error.name}: ${error.message}`;
      if (error.stack) {
        output += `\n  Stack: ${error.stack.split('\n').slice(1, 4).join('\n  ')}`;
      }
    }

    return output;
  }

  // JSON format for production
  return JSON.stringify(entry);
}

/**
 * Check if log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

/**
 * Create a logger instance with a specific context
 */
export function createLogger(context: string): Logger {
  const log = (
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
    error?: Error
  ) => {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      traceId: getTraceId(),
      meta: meta && Object.keys(meta).length > 0 ? meta : undefined,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const output = formatLogEntry(entry);

    switch (level) {
      case 'DEBUG':
      case 'INFO':
        console.log(output);
        break;
      case 'WARN':
        console.warn(output);
        break;
      case 'ERROR':
        console.error(output);
        break;
    }
  };

  return {
    debug: (message: string, meta?: Record<string, unknown>) => {
      log('DEBUG', message, meta);
    },

    info: (message: string, meta?: Record<string, unknown>) => {
      log('INFO', message, meta);
    },

    warn: (message: string, meta?: Record<string, unknown>) => {
      log('WARN', message, meta);
    },

    error: (
      message: string,
      error?: Error | unknown,
      meta?: Record<string, unknown>
    ) => {
      const errorObj =
        error instanceof Error
          ? error
          : error
            ? new Error(String(error))
            : undefined;
      log('ERROR', message, meta, errorObj);
    },
  };
}

// Default logger for quick use
export const logger = createLogger('app');

// Export types
export type { Logger, LogEntry, LogLevel };
