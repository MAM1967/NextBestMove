import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentFailureEmail } from "@/lib/email/resend";

/**
 * SIMPLE test endpoint for Day 0 payment failure email
 * Usage: GET /api/test/send-day0-email?email=mcddsl+onboard2@gmail.com&secret=YOUR_SECRET
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const secret = searchParams.get("secret");
  const requiredSecret = process.env.CRON_SECRET || process.env.TEST_ENDPOINT_SECRET;

  // Simple auth check
  if (!requiredSecret || secret !== requiredSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

