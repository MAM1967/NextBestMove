"use server";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWeeklySummaryEmail } from "@/lib/email/notifications";

/**
 * Test endpoint to manually trigger weekly review email
 *
 * Usage: GET /api/test/send-weekly-review-email?email=your-email@example.com
 * Or: GET /api/test/send-weekly-review-email?userId=user-uuid
 *
 * Optional: ?weekStartDate=2025-01-06 (defaults to previous week's Monday)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get("email");
    const userId = searchParams.get("userId");
    const weekStartDate = searchParams.get("weekStartDate");

    if (!testEmail && !userId) {
      return NextResponse.json(
        { error: "Please provide either 'email' or 'userId' query parameter" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Get user by email or userId
    let user;
    if (testEmail) {
      const { data, error } = await adminClient
        .from("users")
        .select("id, email, name")
        .eq("email", testEmail.toLowerCase().trim())
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json(
          { error: `User not found with email: ${testEmail}` },
          { status: 404 }
        );
      }
      user = data;
    } else if (userId) {
      const { data, error } = await adminClient
        .from("users")
        .select("id, email, name")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json(
          { error: `User not found with userId: ${userId}` },
          { status: 404 }
        );
      }
      user = data;
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate week start date (defaults to previous week's Sunday)
    // Previous week = the week that just ended (Sunday-Saturday)
    // Week structure: Sunday (0) - Saturday (6)
    // If today is Sunday, previous week's Sunday is 7 days ago
    // If today is Monday-Saturday, previous week's Sunday is (dayOfWeek + 7) days ago
    // Example: If today is Tuesday Dec 16 (day 2), last week's Sunday is Dec 7 (9 days ago = 2 + 7)
    let weekStartStr: string;
    if (weekStartDate) {
      weekStartStr = weekStartDate;
    } else {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      let daysToPreviousSunday: number;

      if (dayOfWeek === 0) {
        // Sunday: previous week's Sunday is 7 days ago
        daysToPreviousSunday = 7;
      } else {
        // Monday-Saturday: previous week's Sunday is (dayOfWeek + 7) days ago
        // This ensures we go back to the previous week's Sunday, not this week's
        // Example: If today is Tuesday (day 2), previous Sunday is 2 + 7 = 9 days ago
        daysToPreviousSunday = dayOfWeek + 7;
      }

      const previousSunday = new Date(today);
      previousSunday.setDate(today.getDate() - daysToPreviousSunday);
      previousSunday.setHours(0, 0, 0, 0);
      weekStartStr = previousSunday.toISOString().split("T")[0];
    }

    // Fetch the weekly summary
    const { data: summary, error: summaryError } = await adminClient
      .from("weekly_summaries")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_start_date", weekStartStr)
      .maybeSingle();

    if (summaryError) {
      return NextResponse.json(
        { error: `Error fetching summary: ${summaryError.message}` },
        { status: 500 }
      );
    }

    if (!summary) {
      return NextResponse.json(
        {
          error: `No weekly summary found for week starting ${weekStartStr}. Generate one first using /api/weekly-summaries/generate`,
          weekStartDate: weekStartStr,
          userId: user.id,
        },
        { status: 404 }
      );
    }

    // Parse content prompts if they exist
    let contentPrompts: Array<{ type: string; text: string }> | null = null;
    if (summary.content_prompts && Array.isArray(summary.content_prompts)) {
      contentPrompts = summary.content_prompts;
    }

    // Send email
    console.log("🧪 Testing weekly review email send:", {
      to: user.email,
      userName: user.name,
      weekStartDate: weekStartStr,
    });

    await sendWeeklySummaryEmail({
      to: user.email,
      userName: user.name,
      weekStartDate: weekStartStr,
      daysActive: summary.days_active || 0,
      actionsCompleted: summary.actions_completed || 0,
      replies: summary.replies || 0,
      callsBooked: summary.calls_booked || 0,
      insightText: summary.insight_text,
      nextWeekFocus: summary.next_week_focus,
      contentPrompts,
    });

    return NextResponse.json({
      success: true,
      message: "Test weekly review email sent",
      to: user.email,
      weekStartDate: weekStartStr,
    });
  } catch (error) {
    console.error("❌ Test weekly review email failed:", error);
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
