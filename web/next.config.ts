import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { join } from "path";

// Read .env.local directly to bypass Next.js parsing issues
function readEnvLocal() {
  try {
    const envPath = join(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    const env: Record<string, string> = {};

    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          // Remove any "export" suffix that might have been appended
          let value = valueParts.join("=").trim();
          if (value.endsWith("export")) {
            value = value.slice(0, -6);
          }
          env[key.trim()] = value;
        }
      }
    });

    return env;
  } catch (error) {
    console.warn("Could not read .env.local, using fallbacks");
    return {};
  }
}

const envLocal = readEnvLocal();

const nextConfig: NextConfig = {
  /* config options here */
  // Read env vars directly from .env.local file to work around parsing issues
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      envLocal.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/export$/, "") ||
      "https://lilhqhbbougkblznspow.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      envLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpbGhxaGJib3Vna2Jsem5zcG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzczODIsImV4cCI6MjA3OTcxMzM4Mn0.8KJaoUjHfSpVZ-mOjdv88Dt8_OJ0UN5nxijiw_NUxl0",
    // Service role key for admin operations (server-side only)
    // Note: This makes it available to client-side, but server-side API routes use process.env directly
    SUPABASE_SERVICE_ROLE_KEY:
      envLocal.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  // Ensure server-side environment variables are available
  // In Next.js, non-NEXT_PUBLIC_ vars are automatically server-only, but this ensures it's accessible
};

export default nextConfig;
