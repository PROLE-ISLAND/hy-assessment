// =====================================================
// Supabase Client (Browser)
// For use in Client Components
// =====================================================

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Environment variables check
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Create browser client singleton
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!);
}

// Re-export types for convenience
export type { Database };
