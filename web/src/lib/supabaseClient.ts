import { createClient } from "@supabase/supabase-js";

// Trim whitespace to prevent issues with malformed env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// Debug logging in development
if (process.env.NODE_ENV === "development") {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "⚠️ Supabase env vars are missing. Did you set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY?"
    );
    console.warn(
      "Raw URL:",
      JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL)
    );
    console.warn(
      "Raw Key:",
      JSON.stringify(
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30)
      )
    );
  } else {
    console.log("✅ Supabase URL loaded:", JSON.stringify(supabaseUrl));
    console.log(
      "✅ Supabase key loaded:",
      supabaseAnonKey.substring(0, 20) + "..."
    );
    // Check for suspicious characters
    if (
      supabaseUrl.includes("export") ||
      supabaseUrl.length !== supabaseUrl.trim().length
    ) {
      console.error(
        "❌ URL contains unexpected content:",
        JSON.stringify(supabaseUrl)
      );
      console.error("URL length:", supabaseUrl.length);
      console.error(
        "URL char codes:",
        Array.from(supabaseUrl).map((c) => c.charCodeAt(0))
      );
    }
  }
}

// Only create client if we have the required env vars
// This prevents runtime errors during build/SSR when env vars are missing
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient("", ""); // Fallback to empty strings (will error on actual queries, but won't crash on import)
