import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWinBackEmail } from "@/lib/email/resend";
import { logError, logInfo } from "@/lib/utils/logger";

/**
 * Test endpoint to manually trigger win-back campaign email
 * 
 * Usage: POST /api/test/send-win-back-email?userEmail=mcddsl+onboard2@gmail.com&daysSinceCancellation=7
 * 
 * This is for testing purposes only - should be disabled in production
 */
export async function POST(request: NextRequest) {
  // Simple auth check - require a secret token for production testing
  const authHeader = request.headers.get("authorization");
  const testSecret = (process.env.TEST_ENDPOINT_SECRET || process.env.CRON_SECRET)?.trim().replace(/\r?\n/g, '');
  
  if (process.env.NODE_ENV === "production") {
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
    const daysSinceCancellation = parseInt(searchParams.get("daysSinceCancellation") || "7");

    if (!userEmail) {
      return NextResponse.json({ error: "userEmail query parameter required" }, { status: 400 });
    }

    if (![7, 30, 90, 180].includes(daysSinceCancellation)) {
      return NextResponse.json(
        { error: "daysSinceCancellation must be 7, 30, 90, or 180" },
        { status: 400 }
      );
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

    logInfo("Sending test win-back email", {
      userId: user.id,
      email: user.email,
      daysSinceCancellation,
    });

    // Send the email
    await sendWinBackEmail({
      to: user.email,
      userName: user.name || "there",
      daysSinceCancellation,
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      daysSinceCancellation,
    });
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logError("Error sending test win-back email", errorObj);
    return NextResponse.json(
      { error: "Failed to send email", details: errorObj.message },
      { status: 500 }
    );
  }
}

