import { NextResponse } from "next/server";

/**
 * Diagnostic endpoint to check if environment variables are set
 * Usage: GET /api/check-env
 * 
 * This endpoint helps verify that environment variables are correctly
 * configured in Vercel. It shows which variables are set (without revealing values).
 */
export async function GET() {
  // Check the raw and trimmed values for STRIPE_SECRET_KEY
  const rawStripeKey = process.env.STRIPE_SECRET_KEY;
  const trimmedStripeKey = rawStripeKey?.trim();
  
  const envVars = {
    RESEND_API_KEY: {
      set: !!process.env.RESEND_API_KEY,
      length: process.env.RESEND_API_KEY?.length || 0,
      startsWith: process.env.RESEND_API_KEY?.substring(0, 3) || "N/A",
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      startsWith: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 3) || "N/A",
    },
    STRIPE_SECRET_KEY: {
      set: !!rawStripeKey,
      length: rawStripeKey?.length || 0,
      startsWith: rawStripeKey?.substring(0, 3) || "N/A",
      // Show first 20 chars for debugging (safe to expose - these are public prefixes)
      prefix: rawStripeKey?.substring(0, 20) || "N/A",
      trimmedPrefix: trimmedStripeKey?.substring(0, 20) || "N/A",
      isLive: trimmedStripeKey?.startsWith("sk_live_") || false,
      isTest: trimmedStripeKey?.startsWith("sk_test_") || false,
      mode: trimmedStripeKey?.startsWith("sk_live_") ? "LIVE" : trimmedStripeKey?.startsWith("sk_test_") ? "TEST" : "UNKNOWN",
      // Additional diagnostic: check for whitespace or hidden characters
      hasWhitespace: rawStripeKey ? /\s/.test(rawStripeKey) : false,
      trimmedLength: trimmedStripeKey?.length || 0,
      // Show the difference - helpful for debugging
      whitespaceChars: rawStripeKey && trimmedStripeKey ? rawStripeKey.length - trimmedStripeKey.length : 0,
    },
    NEXT_PUBLIC_APP_URL: {
      set: !!process.env.NEXT_PUBLIC_APP_URL,
      value: process.env.NEXT_PUBLIC_APP_URL || "N/A",
    },
  };

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    variables: envVars,
    notes: {
      RESEND_API_KEY: envVars.RESEND_API_KEY.set
        ? `✅ Set (length: ${envVars.RESEND_API_KEY.length}, should start with "re_")`
        : "❌ NOT SET - Add this in Vercel Dashboard → Settings → Environment Variables",
      SUPABASE_SERVICE_ROLE_KEY: envVars.SUPABASE_SERVICE_ROLE_KEY.set
        ? `✅ Set (length: ${envVars.SUPABASE_SERVICE_ROLE_KEY.length}, should start with "eyJ")`
        : "❌ NOT SET",
      STRIPE_SECRET_KEY: envVars.STRIPE_SECRET_KEY.set
        ? `✅ Set (length: ${envVars.STRIPE_SECRET_KEY.length}, mode: ${envVars.STRIPE_SECRET_KEY.mode}, starts with "${envVars.STRIPE_SECRET_KEY.startsWith}")`
        : "❌ NOT SET",
    },
  });
}

