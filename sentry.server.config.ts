// =====================================================
// Sentry Server Configuration
// Error tracking for Node.js server-side code
// =====================================================

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment configuration
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  // Lower sample rate in production for cost efficiency
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug mode for development
  debug: process.env.NODE_ENV === 'development',

  // Only send errors in production or if explicitly enabled
  enabled: process.env.NODE_ENV === 'production' || !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Filter sensitive data
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
      delete event.request.headers['x-api-key'];
    }

    // Remove sensitive data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.data?.url?.includes('supabase')) {
          // Mask Supabase URLs
          breadcrumb.data.url = '[MASKED_SUPABASE_URL]';
        }
        return breadcrumb;
      });
    }

    return event;
  },
});
