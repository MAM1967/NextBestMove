import { NextRequest, NextResponse } from "next/server";
import { sendStreakRecoveryEmail } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Test endpoint to verify streak recovery email sending
 * Usage: GET /api/test-streak-email?email=your-email@example.com
 * Or: GET /api/test-streak-email?userId=user-uuid
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get("email");
    const userId = searchParams.get("userId");

    let email: string;
    let userName: string = "Test User";

    if (testEmail) {
      email = testEmail;
    } else if (userId) {
      const supabase = createAdminClient();
      const { data: user, error } = await supabase
        .from("users")
        .select("email, name")
        .eq("id", userId)
        .single();

      if (error || !user) {
        return NextResponse.json(
          { error: "User not found", details: error?.message },
          { status: 404 }
        );
      }

      email = user.email;
      userName = user.name || "there";
    } else {
      return NextResponse.json(
        { error: "Missing 'email' or 'userId' query parameter" },
        { status: 400 }
      );
    }

    console.log("🧪 Testing streak recovery email send:", {
      to: email,
      userName,
      from: "NextBestMove <noreply@nextbestmove.app>",
    });

    const result = await sendStreakRecoveryEmail(email, userName);

    return NextResponse.json({
      success: true,
      message: "Test streak recovery email sent",
      emailId: result?.id,
      to: email,
      userName,
    });
  } catch (error) {
    console.error("❌ Test streak recovery email failed:", error);
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

