import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/leads/notes-summary/global-rollup
 * 
 * Returns a global rollup of top overdue items across all relationships.
 * Surfaces the most important items without overloading the user.
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all active relationships
    const { data: relationships, error: relationshipsError } = await supabase
      .from("leads")
      .select("id, name, next_touch_due_at, last_interaction_at")
      .eq("user_id", user.id)
      .eq("status", "ACTIVE");

    if (relationshipsError) {
      console.error("Error fetching relationships:", relationshipsError);
      return NextResponse.json(
        { error: "Failed to fetch relationships" },
        { status: 500 }
      );
    }

    // Get overdue actions across all relationships
    const { data: overdueActions, error: actionsError } = await supabase
      .from("actions")
      .select("id, person_id, action_type, description, due_date, state, lane, next_move_score")
      .eq("user_id", user.id)
      .in("state", ["NEW", "SENT", "SNOOZED"])
      .lt("due_date", today.toISOString().split("T")[0])
      .order("next_move_score", { ascending: false, nullsFirst: false })
      .order("due_date", { ascending: true })
      .limit(10);

    if (actionsError) {
      console.error("Error fetching overdue actions:", actionsError);
      return NextResponse.json(
        { error: "Failed to fetch overdue actions" },
        { status: 500 }
      );
    }

    // Get relationships with overdue next_touch_due_at
    // Use same logic as /api/leads/overdue: overdue if has overdue actions, next touch overdue, or no interaction in 90+ days
    const relationshipIds = relationships?.map((r) => r.id) || [];
    const { data: allPendingActions } = await supabase
      .from("actions")
      .select("id, person_id, due_date")
      .eq("user_id", user.id)
      .in("person_id", relationshipIds)
      .in("state", ["NEW", "SENT", "SNOOZED"]);

    const overdueRelationships = relationships?.filter((rel) => {
      // Count overdue actions for this relationship
      const relationshipActions = (allPendingActions || []).filter(
        (action) => action.person_id === rel.id
      );
      const overdueActions = relationshipActions.filter((action) => {
        const dueDate = new Date(action.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      });
      const hasOverdueActions = overdueActions.length > 0;

      // Check if next touch is overdue
      const nextTouchOverdue =
        rel.next_touch_due_at &&
        new Date(rel.next_touch_due_at) < today;

      // Check if no interaction in 90+ days
      const daysSinceLastInteraction = rel.last_interaction_at
        ? Math.floor(
            (today.getTime() - new Date(rel.last_interaction_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;
      const noInteraction90Days =
        daysSinceLastInteraction !== null && daysSinceLastInteraction > 90;

      // Overdue if any of these conditions are true
      return hasOverdueActions || nextTouchOverdue || noInteraction90Days;
    }) || [];

    // Map actions to relationships
    const relationshipMap = new Map(
      relationships?.map((rel) => [rel.id, rel]) || []
    );

    const rollup = {
      totalOverdueActions: overdueActions?.length || 0,
      totalOverdueRelationships: overdueRelationships.length,
      topOverdueActions: (overdueActions || []).slice(0, 5).map((action) => ({
        id: action.id,
        relationshipId: action.person_id,
        relationshipName: action.person_id
          ? relationshipMap.get(action.person_id)?.name || "Unknown"
          : "No relationship",
        type: action.action_type,
        description: action.description || `${action.action_type} action`,
        dueDate: action.due_date,
        state: action.state,
        lane: action.lane,
        score: action.next_move_score,
      })),
      overdueRelationships: overdueRelationships
        .sort((a, b) => {
          if (!a.next_touch_due_at || !b.next_touch_due_at) return 0;
          return (
            new Date(a.next_touch_due_at).getTime() -
            new Date(b.next_touch_due_at).getTime()
          );
        })
        .slice(0, 5)
        .map((rel) => ({
          id: rel.id,
          name: rel.name,
          nextTouchDueAt: rel.next_touch_due_at,
          daysOverdue: rel.next_touch_due_at
            ? Math.floor(
                (today.getTime() - new Date(rel.next_touch_due_at).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 0,
        })),
    };

    return NextResponse.json({ rollup });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

