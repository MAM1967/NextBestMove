import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateDailyPlanForUser } from "@/lib/plans/generate-daily-plan";

/**
 * POST /api/daily-plans/generate - Generate a daily plan
 * 
 * Authenticated endpoint for users to generate their daily plan.
 * Can also regenerate by deleting existing plan first.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const date = body.date || new Date().toISOString().split("T")[0];

    // Check if plan already exists for this date - if so, delete it to allow regeneration
    const { data: existingPlan } = await supabase
      .from("daily_plans")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle();

    if (existingPlan) {
      // Delete existing plan and its actions to allow regeneration
      // Note: daily_plan_actions will be deleted automatically via CASCADE
      const { error: deleteError } = await supabase
        .from("daily_plans")
        .delete()
        .eq("id", existingPlan.id);

      if (deleteError) {
        console.error("Error deleting existing plan:", deleteError);
        return NextResponse.json(
          { error: "Failed to regenerate plan" },
          { status: 500 }
        );
      }
    }

    // Use shared generation function
    const result = await generateDailyPlanForUser(supabase, user.id, date);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate plan" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      dailyPlan: result.dailyPlan,
    });
  } catch (error) {
    console.error("Unexpected error generating plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
