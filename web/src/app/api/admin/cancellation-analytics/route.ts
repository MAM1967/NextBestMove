import { createClient } from "@/lib/supabase/server";
import { getAdminClient, isAdmin } from "@/lib/admin/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const admin = await isAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use admin client to bypass RLS
    const adminClient = getAdminClient();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const reasonFilter = searchParams.get("reason");

    // Build query
    let query = adminClient
      .from("cancellation_feedback")
      .select(
        `
        id,
        user_id,
        subscription_id,
        cancellation_reason,
        additional_feedback,
        created_at,
        users!inner(email, name)
      `
      )
      .order("created_at", { ascending: false });

    // Apply filters
    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }
    if (reasonFilter) {
      query = query.eq("cancellation_reason", reasonFilter);
    }

    const { data: feedback, error: feedbackError } = await query;

    if (feedbackError) {
      console.error("Error fetching cancellation feedback:", feedbackError);
      return NextResponse.json(
        { error: feedbackError.message },
        { status: 500 }
      );
    }

    // Calculate breakdown by reason
    const reasonBreakdown: Record<string, number> = {};
    const total = feedback?.length || 0;

    feedback?.forEach((item) => {
      const reason = item.cancellation_reason || "unknown";
      reasonBreakdown[reason] = (reasonBreakdown[reason] || 0) + 1;
    });

    // Convert to array for chart data
    const breakdownData = Object.entries(reasonBreakdown).map(
      ([reason, count]) => ({
        reason,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      })
    );

    return NextResponse.json({
      total,
      breakdown: breakdownData,
      feedback: feedback || [],
    });
  } catch (error) {
    console.error("Error in cancellation analytics:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

