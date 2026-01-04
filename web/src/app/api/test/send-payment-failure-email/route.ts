import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentFailureEmail } from "@/lib/email/resend";
import { logError, logInfo } from "@/lib/utils/logger";

/**
 * Test endpoint to manually trigger Day 0 payment failure email
 * 
 * Usage: POST /api/test/send-payment-failure-email?userEmail=mcddsl+onboard2@gmail.com&daysSinceFailure=0
 * 
 * This is for testing purposes only - should be disabled in production
 */
export async function POST(request: NextRequest) {
  // Detect staging environment (same logic as email system)
  const isStaging = 
    process.env.VERCEL_ENV === "preview" ||
    process.env.NEXT_PUBLIC_APP_URL?.includes("staging.nextbestmove.app") ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === "staging";
  
  // Simple auth check - require a secret token for production testing
  // Skip auth in staging/preview environments
  const authHeader = request.headers.get("authorization");
  const testSecret = (process.env.TEST_ENDPOINT_SECRET || process.env.CRON_SECRET)?.trim().replace(/\r?\n/g, '');
  
  // Only require auth in production (not staging/preview)
  if (!isStaging && process.env.NODE_ENV === "production") {
    if (!testSecret) {
      return NextResponse.json(
        { error: "Test endpoint not configured for production" },
        { status: 403 }
      );
    }
    
    const providedSecret = (authHeader?.replace("Bearer ", "") || 
                          new URL(request.url).searchParams.get("secret"))?.trim();
    
    if (providedSecret !== testSecret) {
      return NextResponse.json(
        { error: "Unauthorized - provide TEST_ENDPOINT_SECRET or CRON_SECRET" },
        { status: 401 }
      );
    }
  }

  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");
    const daysSinceFailure = parseInt(searchParams.get("daysSinceFailure") || "0");

    if (!userEmail) {
      return NextResponse.json({ error: "userEmail query parameter required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get user info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("email", userEmail)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { error: `User not found: ${userEmail}`, details: userError },
        { status: 404 }
      );
    }

    logInfo("Sending test payment failure email", {
      userId: user.id,
      email: user.email,
      daysSinceFailure,
    });

    // Send the email
    await sendPaymentFailureEmail({
      to: user.email,
      userName: user.name || "there",
      daysSinceFailure,
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      daysSinceFailure,
    });
  } catch (error: any) {
    logError("Error sending test payment failure email", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error.message },
      { status: 500 }
    );
  }
}

