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
    let action: ActionWithLeads | null = null;
    
    const { data: actionWithLeads, error: joinError } = await supabase
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

    if (joinError) {
      console.warn("Error fetching best action with leads join, trying without join:", joinError);
      // Fallback: fetch action without leads join
      const { data: actionOnly, error: actionError } = await supabase
        .from("actions")
        .select("*")
        .eq("id", bestAction.actionId)
        .single();

      if (actionError || !actionOnly) {
        console.error("Error fetching best action (both with and without join):", actionError);
        return NextResponse.json(
          { error: "Failed to fetch action details" },
          { status: 500 }
        );
      }

      action = actionOnly;
      
      // Fetch lead separately if needed
      if (action.person_id) {
        const { data: lead } = await supabase
          .from("leads")
          .select("id, name, url, notes")
          .eq("id", action.person_id)
          .eq("user_id", user.id)
          .single();
        
        if (lead) {
          action.leads = lead;
        }
      }
    } else {
      action = actionWithLeads;
    }

    if (!action) {
      console.error("Action not found");
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
