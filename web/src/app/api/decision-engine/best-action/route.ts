import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getBestAction } from "@/lib/decision-engine";
import { calculateUrgencyValue } from "@/lib/signals/urgency-value-calculator";

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
    let action: any | null = null;
    let relationshipData: any | null = null;
    
    const { data: actionWithLeads, error: joinError } = await supabase
      .from("actions")
      .select(
        `
        *,
        leads (
          id,
          name,
          url,
          notes,
          tier,
          last_interaction_at,
          relationship_state
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
          .select("id, name, url, notes, tier, last_interaction_at, relationship_state")
          .eq("id", action.person_id)
          .eq("user_id", user.id)
          .single();
        
        if (lead) {
          action.leads = lead;
          relationshipData = lead;
        }
      }
    } else {
      action = actionWithLeads;
      if (action?.leads) {
        relationshipData = action.leads;
      }
    }

    if (!action) {
      console.error("Action not found");
      return NextResponse.json(
        { error: "Failed to fetch action details" },
        { status: 500 }
      );
    }

    // Calculate urgency/value for qualitative label
    let urgencyValueLabel: string | null = null;
    if (relationshipData && action.person_id) {
      try {
        // Calculate days since last interaction
        const lastInteractionAt = relationshipData.last_interaction_at
          ? new Date(relationshipData.last_interaction_at)
          : null;
        const daysSinceLastInteraction = lastInteractionAt
          ? Math.floor(
              (Date.now() - lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24)
            )
          : 999; // Never interacted

        // Count overdue actions for this relationship
        const { count: overdueCount } = await supabase
          .from("actions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("person_id", action.person_id)
          .eq("state", "NEW")
          .lt("due_date", new Date().toISOString().split("T")[0]);

        // Check for urgent email signals
        const { data: recentEmails } = await supabase
          .from("email_metadata")
          .select("sentiment")
          .eq("user_id", user.id)
          .eq("person_id", action.person_id)
          .gte("received_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order("received_at", { ascending: false })
          .limit(5);

        const hasUrgentEmailSentiment =
          recentEmails?.some((e) => e.sentiment === "urgent") || false;

        // Check for open loops
        const { data: emailsWithOpenLoops } = await supabase
          .from("email_metadata")
          .select("open_loops")
          .eq("user_id", user.id)
          .eq("person_id", action.person_id)
          .not("open_loops", "is", null)
          .gte("received_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        const hasOpenLoops = (emailsWithOpenLoops?.length || 0) > 0;

        // Calculate response rate (simplified - count actions with REPLIED state)
        const { count: totalActions } = await supabase
          .from("actions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("person_id", action.person_id)
          .in("state", ["DONE", "REPLIED", "SENT"]);

        const { count: repliedActions } = await supabase
          .from("actions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("person_id", action.person_id)
          .eq("state", "REPLIED");

        const responseRate =
          (totalActions || 0) > 0 ? (repliedActions || 0) / (totalActions || 1) : 0;

        // Check if in OPPORTUNITY state
        const hasDealPotential =
          relationshipData.relationship_state === "OPPORTUNITY";

        // Calculate urgency/value
        const urgencyValue = calculateUrgencyValue({
          daysSinceLastInteraction,
          overdueActionsCount: overdueCount || 0,
          hasUrgentEmailSentiment,
          hasOpenLoops,
          tier: relationshipData.tier,
          responseRate,
          hasDealPotential,
        });

        urgencyValueLabel = urgencyValue.label;
      } catch (error) {
        console.error("Error calculating urgency/value:", error);
        // Fallback to default label
        urgencyValueLabel = "High urgency, high value relationship";
      }
    }

    // Add lane and score to action (keep score for internal use, but don't display)
    const actionWithLane = {
      ...action,
      lane: bestAction.lane,
      next_move_score: bestAction.score,
      urgency_value_label: urgencyValueLabel,
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
