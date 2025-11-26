import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // In dev this helps you notice misconfiguration quickly.
  // In production, these should always be set in Vercel env vars.
  console.warn(
    "Supabase env vars are missing. Did you set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY?"
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");


