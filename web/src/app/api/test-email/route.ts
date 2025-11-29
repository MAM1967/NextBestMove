import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email/resend";

/**
 * Test endpoint to verify Resend email sending
 * Usage: POST /api/test-email?to=your-email@example.com
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get("to");

    if (!testEmail) {
      return NextResponse.json(
        { error: "Missing 'to' query parameter" },
        { status: 400 }
      );
    }

    // Generate a test reset link
    const testLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://nextbestmove.app"}/auth/reset-password#access_token=test&type=recovery`;

    console.log("🧪 Testing email send:", {
      to: testEmail,
      from: "NextBestMove <noreply@nextbestmove.app>",
    });

    const result = await sendPasswordResetEmail({
      to: testEmail,
      userName: "Test User",
      resetLink: testLink,
    });

    return NextResponse.json({
      success: true,
      message: "Test email sent",
      emailId: result?.id,
      to: testEmail,
    });
  } catch (error) {
    console.error("❌ Test email failed:", error);
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

