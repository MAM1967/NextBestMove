import { NextResponse } from "next/server";

/**
 * Diagnostic endpoint to check if environment variables are set
 * Usage: GET /api/check-env
 * 
 * This endpoint helps verify that environment variables are correctly
 * configured in Vercel. It shows which variables are set (without revealing values).
 */
export async function GET() {
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
      set: !!process.env.STRIPE_SECRET_KEY,
      length: process.env.STRIPE_SECRET_KEY?.length || 0,
      startsWith: process.env.STRIPE_SECRET_KEY?.substring(0, 3) || "N/A",
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
        ? `✅ Set (length: ${envVars.STRIPE_SECRET_KEY.length}, should start with "sk_")`
        : "❌ NOT SET",
    },
  });
}

