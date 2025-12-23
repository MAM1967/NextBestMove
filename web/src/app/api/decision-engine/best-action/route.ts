import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getBestAction } from "@/lib/decision-engine";

/**
 * GET /api/decision-engine/best-action
 * 
 * Returns the single "Best Action" for the authenticated user.
 * This is the highest-scoring action from Priority or In Motion lanes.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get best action from decision engine
    const bestAction = await getBestAction(supabase, user.id);

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
