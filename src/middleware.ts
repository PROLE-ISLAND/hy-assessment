// =====================================================
// Next.js Middleware
// Authentication, route protection, and trace ID
// =====================================================

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Trace ID header name
const TRACE_ID_HEADER = 'x-trace-id';

// Routes that don't require authentication
const publicRoutes = [
  '/login',
  '/auth/callback',
  '/assessment', // Public assessment pages (accessed via token)
  '/report', // Public candidate report pages (accessed via token)
  '/api/health', // Health check endpoint for monitoring
];

// Check if path matches any public route
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

// Generate a trace ID (simple UUID v4 implementation for Edge)
function generateTraceId(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get or generate trace ID
  const incomingTraceId = request.headers.get(TRACE_ID_HEADER);
  const traceId = incomingTraceId || generateTraceId();

  // Update session and get user
  const { supabaseResponse, user } = await updateSession(request);

  // Add trace ID to response headers
  supabaseResponse.headers.set(TRACE_ID_HEADER, traceId);

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return supabaseResponse;
  }

  // Redirect to login if not authenticated
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.headers.set(TRACE_ID_HEADER, traceId);
    return redirectResponse;
  }

  // User is authenticated, continue
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
