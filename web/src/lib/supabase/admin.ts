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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const rawServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const serviceRoleKey = rawServiceRoleKey?.trim();

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }

  if (!serviceRoleKey) {
    const availableKeys = Object.keys(process.env).filter(k => 
      k.includes("SERVICE") || k.includes("SUPABASE")
    );
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY is not set. Available env vars: ${availableKeys.join(", ")}`
    );
  }

  // Validate key format - must be JWT format (starts with "eyJ")
  // Sometimes keys get truncated - check if it's missing the first character
  let correctedKey = serviceRoleKey;
  if (!serviceRoleKey.startsWith("eyJ") && serviceRoleKey.startsWith("yJ")) {
    // Key is missing the first "e" - add it back
    console.warn("⚠️ Service role key appears to be missing first character 'e'. Attempting to fix...");
    correctedKey = "e" + serviceRoleKey;
  }
  
  if (!correctedKey.startsWith("eyJ")) {
    console.error("❌ Service role key format error:");
    console.error("   Key starts with:", serviceRoleKey.substring(0, 20));
    console.error("   Key length:", serviceRoleKey.length);
    console.error("   Expected: JWT format starting with 'eyJ'");
    throw new Error(
      `Invalid service role key format: Service role key must be JWT format (starts with 'eyJ'). ` +
      `Get it from Supabase Dashboard → Settings → API → service_role key (secret). ` +
      `The key appears to be truncated or corrupted. ` +
      `Current key starts with: ${serviceRoleKey.substring(0, 20)}... ` +
      `Please check your Vercel environment variable SUPABASE_SERVICE_ROLE_KEY and ensure the full key is present.`
    );
  }
  
  // Use corrected key if we fixed it
  const finalKey = correctedKey !== serviceRoleKey ? correctedKey : serviceRoleKey;

  return createClient(supabaseUrl, finalKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

