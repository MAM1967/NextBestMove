import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentFailureEmail } from "@/lib/email/resend";

/**
 * SIMPLE test endpoint for Day 0 payment failure email
 * Usage: GET /api/test/send-day0-email?email=mcddsl+onboard2@gmail.com&secret=YOUR_SECRET
 */
export async function GET(request: NextRequest) {
  // Match the same auth pattern as other cron endpoints
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  
  // Trim whitespace and newlines from environment variables (Vercel sometimes adds trailing newlines)
  const cronSecret = process.env.CRON_SECRET?.trim().replace(/\r?\n/g, '');
  const cronJobOrgApiKey = process.env.CRON_JOB_ORG_API_KEY?.trim().replace(/\r?\n/g, '');

  // Normalize secrets for comparison (trim whitespace)
  const normalizedQuerySecret = querySecret?.trim();
  const normalizedAuthHeader = authHeader?.trim();

  // Check Authorization header (Vercel Cron secret or cron-job.org API key), then query param (cron-job.org secret)
  const isAuthorized = (
    (cronSecret && normalizedAuthHeader === `Bearer ${cronSecret}`) ||
    (cronJobOrgApiKey && normalizedAuthHeader === `Bearer ${cronJobOrgApiKey}`) ||
    (cronSecret && normalizedQuerySecret === cronSecret)
  );

  if (!isAuthorized) {
    // Debug info (remove in production)
    const debugInfo = {
      hasCronSecret: !!cronSecret,
      cronSecretLength: cronSecret?.length || 0,
      cronSecretStartsWith: cronSecret?.substring(0, 10) || "N/A",
      querySecretLength: querySecret?.length || 0,
      querySecretStartsWith: querySecret?.substring(0, 10) || "N/A",
      secretsMatch: cronSecret === querySecret,
      hasAuthHeader: !!authHeader,
    };
    
    return NextResponse.json({ 
      error: "Unauthorized",
      hint: "Use ?secret=CRON_SECRET or Authorization: Bearer CRON_SECRET",
      debug: process.env.NODE_ENV === "development" ? debugInfo : undefined
    }, { status: 401 });
  }

  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email parameter required" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // Get user
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("email", email)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: `User not found: ${email}`, details: error }, { status: 404 });
    }

    // Send Day 0 email
    await sendPaymentFailureEmail({
      to: user.email,
      userName: user.name || "there",
      daysSinceFailure: 0,
    });

    return NextResponse.json({
      success: true,
      message: "Day 0 email sent",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to send email", details: error.message }, { status: 500 });
  }
}

