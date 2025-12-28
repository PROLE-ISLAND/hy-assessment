// =====================================================
// Next.js Instrumentation
// Initializes monitoring and error tracking
// =====================================================

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side Sentry initialization
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime Sentry initialization
    await import('../sentry.edge.config');
  }
}

export const onRequestError = async (
  error: Error & { digest?: string },
  request: {
    path: string;
    method: string;
    headers: Record<string, string>;
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
    renderSource:
      | 'react-server-components'
      | 'react-server-components-payload'
      | 'server-rendering';
    revalidateReason: 'on-demand' | 'stale' | undefined;
    renderType: 'dynamic' | 'dynamic-resume';
  }
) => {
  // Import Sentry dynamically to avoid issues with edge runtime
  const Sentry = await import('@sentry/nextjs');

  Sentry.captureException(error, {
    extra: {
      requestPath: request.path,
      requestMethod: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
      digest: error.digest,
    },
    tags: {
      'request.method': request.method,
      'route.type': context.routeType,
      'router.kind': context.routerKind,
    },
  });
};
