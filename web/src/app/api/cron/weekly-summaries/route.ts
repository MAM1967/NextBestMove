import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/cron/weekly-summaries
 * 
 * Cron job to generate weekly summaries for all active users.
 * Runs Monday at 1 AM UTC (Sunday night / Monday morning).
 * Generates summary for the previous week (Monday-Sunday).
 * 
 * This endpoint is called by Vercel Cron and requires authentication via
 * the Authorization header with a secret token.
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret (Vercel Cron sends this header)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Calculate previous week (Monday to Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysToLastMonday - 7); // Go back to previous week's Monday
    lastMonday.setHours(0, 0, 0, 0);

    const weekStartStr = lastMonday.toISOString().split("T")[0];

    // Get all active users
    const { data: users, error: usersError } = await adminClient
      .from("users")
      .select("id")
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users", details: usersError.message },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No users found",
        generated: 0 
      });
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    // Generate summaries for each user
    const { generateWeeklySummaryForUser } = await import("@/lib/summaries/generate-weekly-summary");
    
    for (const user of users) {
      try {
        const result = await generateWeeklySummaryForUser(
          adminClient,
          user.id,
          weekStartStr
        );

        if (!result.success) {
          // Skip if summary already exists (not an error)
          if (result.error?.includes("already exists")) {
            skippedCount++;
            continue;
          }
          errorCount++;
          errors.push({ userId: user.id, error: result.error || "Unknown error" });
        } else {
          successCount++;
        }
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ userId: user.id, error: errorMessage });
        console.error(`Error generating summary for user ${user.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      weekStartDate: weekStartStr,
      totalUsers: users.length,
      generated: successCount,
      skipped: skippedCount,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

