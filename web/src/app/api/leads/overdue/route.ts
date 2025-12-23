import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/leads/overdue - Get top overdue relationships
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all ACTIVE relationships
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "ACTIVE")
      .order("next_touch_due_at", { ascending: true, nullsFirst: false });

    if (leadsError) {
      console.error("Error fetching leads:", leadsError);
      return NextResponse.json(
        { error: "Failed to fetch relationships" },
        { status: 500 }
      );
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ relationships: [] });
    }

    const now = new Date();
    const leadIds = leads.map((lead) => lead.id);

    // Get all pending actions for these relationships
    const { data: actions, error: actionsError } = await supabase
      .from("actions")
      .select("id, person_id, due_date")
      .eq("user_id", user.id)
      .in("person_id", leadIds)
      .in("state", ["NEW", "SENT", "SNOOZED"]);

    if (actionsError) {
      console.error("Error fetching actions:", actionsError);
      return NextResponse.json(
        { error: "Failed to fetch actions" },
        { status: 500 }
      );
    }

    // Calculate overdue metrics for each relationship
    const overdueRelationships = leads
      .map((lead) => {
        // Count overdue actions
        const relationshipActions = (actions || []).filter(
          (action) => action.person_id === lead.id
        );
        const overdueActions = relationshipActions.filter((action) => {
          const dueDate = new Date(action.due_date);
          return dueDate < now;
        });
        const overdueActionsCount = overdueActions.length;

        // Check if next touch is overdue
        const nextTouchOverdue =
          lead.next_touch_due_at &&
          new Date(lead.next_touch_due_at) < now;

        // Calculate days since last interaction
        const daysSinceLastInteraction = lead.last_interaction_at
          ? Math.floor(
              (now.getTime() - new Date(lead.last_interaction_at).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        // Determine if this relationship is "overdue"
        // Overdue if: has overdue actions, next touch is overdue, or no interaction in 90+ days
        const isOverdue =
          overdueActionsCount > 0 ||
          nextTouchOverdue ||
          (daysSinceLastInteraction !== null && daysSinceLastInteraction > 90);

        if (!isOverdue) {
          return null;
        }

        return {
          lead,
          overdueActionsCount,
          daysSinceLastInteraction,
          nextTouchOverdue: !!nextTouchOverdue,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        // Sort by priority: most overdue actions first, then next touch due date
        if (a.overdueActionsCount !== b.overdueActionsCount) {
          return b.overdueActionsCount - a.overdueActionsCount;
        }
        if (a.lead.next_touch_due_at && b.lead.next_touch_due_at) {
          return (
            new Date(a.lead.next_touch_due_at).getTime() -
            new Date(b.lead.next_touch_due_at).getTime()
          );
        }
        return 0;
      })
      .slice(0, 5); // Top 5

    return NextResponse.json({ relationships: overdueRelationships });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

