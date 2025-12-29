import { createClient } from "@/lib/supabase/server";
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");

    // Build query
    let query = supabase
      .from("analytics_insights")
      .select("*")
      .eq("user_id", user.id)
      .order("period_start", { ascending: false });

    if (startDate) {
      query = query.gte("period_start", startDate);
    }
    if (endDate) {
      query = query.lte("period_end", endDate);
    }
    if (type) {
      query = query.eq("insight_type", type);
    }

    const { data: insights, error } = await query;

    if (error) {
      console.error("Error fetching insights:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Transform to frontend format
    const formattedInsights = insights?.map((insight) => ({
      id: insight.id,
      type: insight.insight_type,
      data: insight.insight_data,
      calculatedAt: insight.calculated_at,
      periodStart: insight.period_start,
      periodEnd: insight.period_end,
    })) || [];

    return NextResponse.json({ insights: formattedInsights });
  } catch (error) {
    console.error("Error fetching insights:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

