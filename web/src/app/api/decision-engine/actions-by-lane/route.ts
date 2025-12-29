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
    // Try with leads join first, fallback to without if it fails (RLS might block the join)
    type ActionWithLeads = {
      id: string;
      action_type: string;
      state: string;
      description?: string;
      due_date: string;
      person_id?: string | null;
      leads?: {
        id: string;
        name: string;
        url?: string;
        notes?: string;
      } | null;
      [key: string]: unknown;
    };
    let actions: ActionWithLeads[] | null = null;
    
    const { data: actionsWithLeads, error: joinError } = await supabase
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

    if (joinError) {
      console.warn("Error fetching actions with leads join, trying without join:", joinError);
      // Fallback: fetch actions without leads join
      const { data: actionsOnly, error: actionsError } = await supabase
        .from("actions")
        .select("*")
        .eq("user_id", user.id)
        .in("state", ["NEW", "SENT", "SNOOZED"]);

      if (actionsError) {
        console.error("Error fetching actions (both with and without join):", actionsError);
        return NextResponse.json(
          { error: "Failed to fetch actions" },
          { status: 500 }
        );
      }

      actions = actionsOnly;
      
      // Fetch leads separately for each action if needed
      if (actions && actions.length > 0) {
        const leadIds = actions
          .map(a => a.person_id)
          .filter((id): id is string => id !== null);
        
        if (leadIds.length > 0) {
          const { data: leads } = await supabase
            .from("leads")
            .select("id, name, url, notes")
            .eq("user_id", user.id)
            .in("id", leadIds);
          
          // Attach leads to actions
          if (leads) {
            const leadsMap = new Map(leads.map(l => [l.id, l]));
            actions = actions.map(action => ({
              ...action,
              leads: action.person_id ? leadsMap.get(action.person_id) || null : null
            }));
          }
        }
      }
    } else {
      actions = actionsWithLeads;
    }

    // Group actions by lane
    const actionsByLane: {
      priority: ActionWithLeads[];
      in_motion: ActionWithLeads[];
      on_deck: ActionWithLeads[];
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
        const scoreA = typeof a.next_move_score === "number" ? a.next_move_score : 0;
        const scoreB = typeof b.next_move_score === "number" ? b.next_move_score : 0;
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
