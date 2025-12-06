import { NextResponse } from "next/server";

// Debug endpoint to check environment variables (staging only)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const hostname = url.hostname;
  
  // Only allow on staging
  if (hostname !== "staging.nextbestmove.app" && !hostname.includes("vercel.app")) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Check if this is staging Supabase (ends with adgiptzbxnzddbgfeuut.supabase.co)
  const isStagingSupabase = supabaseUrl.includes("adgiptzbxnzddbgfeuut.supabase.co");
  
  return NextResponse.json({
    hostname,
    vercelEnv: process.env.VERCEL_ENV,
    hasStagingUser: !!process.env.STAGING_USER,
    hasStagingPass: !!process.env.STAGING_PASS,
    stagingUserLength: process.env.STAGING_USER?.length || 0,
    stagingPassLength: process.env.STAGING_PASS?.length || 0,
    // Supabase debugging - critical to diagnose sign-in issue
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "MISSING",
    supabaseUrlFull: supabaseUrl || "MISSING",
    hasAnonKey,
    isStagingSupabase,
    // This will help us see if server is using staging or production Supabase
    supabaseProjectId: supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || "unknown",
  });
}

