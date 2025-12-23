// =====================================================
// Supabase Client Exports
// =====================================================

// Browser client (use in Client Components)
export { createClient } from './client';

// Server clients (use in Server Components, Server Actions, Route Handlers)
export { createClient as createServerClient, createAdminClient } from './server';

// Middleware helper
export { updateSession } from './middleware';

// Types
export type { Database } from '@/types/database';
