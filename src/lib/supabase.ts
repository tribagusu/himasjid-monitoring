import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy-initialized Supabase admin client
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Get the Supabase admin client (service role).
 * Lazy initialization to avoid build-time env var issues.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Missing Supabase environment variables. " +
          "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      );
    }

    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return _supabaseAdmin;
}

// Legacy export for compatibility
export const supabaseAdmin = {
  get client() {
    return getSupabaseAdmin();
  },
};
