import { createClient } from "@/lib/supabase/server";
import { calculateDealProgression } from "@/lib/analytics/deal-progression";
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
    const stage = searchParams.get("stage");

    const metrics = await calculateDealProgression(
      supabase,
      user.id,
      startDate || undefined,
      endDate || undefined
    );

    // Filter by stage if requested
    if (stage && stage in metrics.byStage) {
      return NextResponse.json({
        ...metrics,
        filteredStage: stage,
        count: metrics.byStage[stage as keyof typeof metrics.byStage],
      });
    }

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error calculating deal progression:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

