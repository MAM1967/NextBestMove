import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getBestAction } from "@/lib/decision-engine";

/**
 * GET /api/decision-engine/best-action?duration=5|10|15
 * 
 * Returns the single "Best Action" for the authenticated user.
 * This is the highest-scoring action from Priority or In Motion lanes.
 * 
 * Query parameters:
 * - duration: Optional duration filter (5, 10, or 15 minutes). Filters actions to only those with estimated_minutes <= duration.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Parse duration query parameter
    const { searchParams } = new URL(request.url);
    const durationParam = searchParams.get("duration");
    const maxDurationMinutes = durationParam 
      ? parseInt(durationParam, 10) 
      : null;
    
    // Validate duration parameter
    if (maxDurationMinutes !== null && (isNaN(maxDurationMinutes) || ![5, 10, 15].includes(maxDurationMinutes))) {
      return NextResponse.json(
        { error: "Invalid duration parameter. Must be 5, 10, or 15." },
        { status: 400 }
      );
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get best action from decision engine (with optional duration filter)
    const bestAction = await getBestAction(supabase, user.id, maxDurationMinutes);

    if (!bestAction) {
      return NextResponse.json({
        action: null,
        reason: "No actions available",
      });
    }

    // Fetch full action data with relationship
    const { data: action, error: actionError } = await supabase
      .from("actions")
      .select(
        `
        *,
        leads (
          id,
          name,
          url,
          notes
        )
      `
      )
      .eq("id", bestAction.actionId)
      .single();

    if (actionError || !action) {
      console.error("Error fetching best action:", actionError);
      return NextResponse.json(
        { error: "Failed to fetch action details" },
        { status: 500 }
      );
    }

    // Add lane and score to action
    const actionWithLane = {
      ...action,
      lane: bestAction.lane,
      next_move_score: bestAction.score,
    };

    return NextResponse.json({
      action: actionWithLane,
      reason: bestAction.reason,
    });
  } catch (error) {
    console.error("Error in best-action endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
