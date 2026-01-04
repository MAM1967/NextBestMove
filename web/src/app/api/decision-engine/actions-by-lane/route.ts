import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { runDecisionEngine } from "@/lib/decision-engine";
import { assignActionLane, assignRelationshipLane } from "@/lib/decision-engine/lanes";
import { computeRelationshipStates } from "@/lib/decision-engine/state";

/**
 * GET /api/decision-engine/actions-by-lane
 * 
 * Returns actions grouped by lane (Priority / In Motion / On Deck).
 * Optional query parameter: ?lane=priority|in_motion|on_deck to filter by specific lane.
 */
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
    const laneFilter = searchParams.get("lane") as
      | "priority"
      | "in_motion"
      | "on_deck"
      | null;

    // Run decision engine to get scored actions
    const today = new Date();
    const decisionResult = await runDecisionEngine(supabase, user.id, {
      persist: false,
      referenceDate: today,
    });

    // Compute relationship states for lane assignment
    const relationshipStates = await computeRelationshipStates(
      supabase,
      user.id,
      today
    );

    // Fetch all candidate actions
    const { data: actions, error: actionsError } = await supabase
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
      .eq("user_id", user.id)
      .in("state", ["NEW", "SENT", "SNOOZED"]);

    if (actionsError) {
      console.error("Error fetching actions:", actionsError);
      return NextResponse.json(
        { error: "Failed to fetch actions" },
        { status: 500 }
      );
    }

    // Group actions by lane
    const actionsByLane: {
      priority: any[];
      in_motion: any[];
      on_deck: any[];
    } = {
      priority: [],
      in_motion: [],
      on_deck: [],
    };

    for (const action of actions || []) {
      // Get relationship state if action is tied to a relationship
      const relationshipState = action.person_id
        ? relationshipStates.get(action.person_id) || null
        : null;

      // Get relationship lane
      const relationshipLane = relationshipState
        ? assignRelationshipLane(relationshipState).lane
        : "on_deck";

      // Get action lane
      const actionLaneAssignment = assignActionLane(
        action,
        relationshipLane,
        today
      );

      // Get score from decision engine result
      const scoredAction = decisionResult.scoredActions.find(
        (s) => s.actionId === action.id
      );

      // Add lane and score to action
      const actionWithLane = {
        ...action,
        lane: actionLaneAssignment.lane,
        next_move_score: scoredAction?.score || null,
      };

      // Add to appropriate lane group
      if (laneFilter) {
        if (actionLaneAssignment.lane === laneFilter) {
          actionsByLane[laneFilter].push(actionWithLane);
        }
      } else {
        actionsByLane[actionLaneAssignment.lane].push(actionWithLane);
      }
    }

    // Sort each lane by score (descending)
    for (const lane of Object.keys(actionsByLane) as Array<
      keyof typeof actionsByLane
    >) {
      actionsByLane[lane].sort((a, b) => {
        const scoreA = a.next_move_score || 0;
        const scoreB = b.next_move_score || 0;
        return scoreB - scoreA;
      });
    }

    if (laneFilter) {
      return NextResponse.json({
        [laneFilter]: actionsByLane[laneFilter],
      });
    }

    return NextResponse.json(actionsByLane);
  } catch (error) {
    console.error("Error in actions-by-lane endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
