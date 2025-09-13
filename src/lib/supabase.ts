import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = () =>
  createBrowserClient<Database>(
    supabaseUrl!,
    supabaseKey!,
  );

// For backward compatibility, export a default client instance
export const supabase = createClient()

// Admin client for server-side operations - created lazily
let _supabaseAdmin: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export const getSupabaseAdmin = () => {
  if (!_supabaseAdmin && typeof window === 'undefined') {
    // Only create admin client on server-side
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
    }
    _supabaseAdmin = createSupabaseClient<Database>(
      supabaseUrl!,
      serviceRoleKey
    );
  }
  return _supabaseAdmin;
}

// Legacy export for backward compatibility (will throw error if used on client-side)
export const supabaseAdmin = new Proxy({} as any, {
  get() {
    throw new Error('Use getSupabaseAdmin() instead of supabaseAdmin. Admin client should only be used on server-side.');
  }
});
