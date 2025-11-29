import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase admin client using the service role key.
 * This bypasses RLS and should only be used server-side for:
 * - Webhook handlers (no user auth context)
 * - Admin operations (account deletion, etc.)
 * 
 * NEVER expose this client to the browser or use it in client components.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

