// =====================================================
// Sentry Client Configuration
// Error tracking and performance monitoring for browser
// =====================================================

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment configuration
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  replaysOnErrorSampleRate: 1.0,

  // Debug mode for development
  debug: process.env.NODE_ENV === 'development',

  // Only send errors in production or if explicitly enabled
  enabled: process.env.NODE_ENV === 'production' || !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      // Mask all text content by default
      maskAllText: true,
      // Block all media content by default
      blockAllMedia: true,
    }),
  ],

  // Filter out known non-critical errors
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Ignore ResizeObserver errors (common browser quirk)
    if (error instanceof Error && error.message?.includes('ResizeObserver')) {
      return null;
    }

    // Ignore network errors for analytics/tracking scripts
    if (
      error instanceof Error &&
      error.message?.match(/Loading chunk \d+ failed/)
    ) {
      return null;
    }

    return event;
  },
});
