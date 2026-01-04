import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { calculateUrgencyValue } from "@/lib/signals/urgency-value-calculator";

/**
 * GET /api/signals/urgency-value-matrix
 * 
 * Returns all relationships grouped by urgency/value quadrants for the 2x2 matrix.
 * Calculates urgency and value for each relationship and groups them.
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

    // Get all active relationships
    const { data: relationships, error: relationshipsError } = await supabase
      .from("leads")
      .select("id, name, tier, last_interaction_at, relationship_state")
      .eq("user_id", user.id)
      .eq("status", "ACTIVE");

    if (relationshipsError) {
      console.error("Error fetching relationships:", relationshipsError);
      return NextResponse.json(
        { error: "Failed to fetch relationships" },
        { status: 500 }
      );
    }

    if (!relationships || relationships.length === 0) {
      return NextResponse.json({
        quadrants: {
          "high-high": [],
          "high-low": [],
          "low-high": [],
          "low-low": [],
        },
      });
    }

    const relationshipIds = relationships.map((r) => r.id);
    const now = new Date();

    // Get all pending actions for these relationships
    const { data: allActions } = await supabase
      .from("actions")
      .select("id, person_id, due_date, state")
      .eq("user_id", user.id)
      .in("person_id", relationshipIds)
      .in("state", ["NEW", "SENT", "SNOOZED"]);

    // Get email signals for these relationships
    const { data: recentEmails } = await supabase
      .from("email_metadata")
      .select("person_id, sentiment, open_loops, received_at")
      .eq("user_id", user.id)
      .in("person_id", relationshipIds)
      .gte("received_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("received_at", { ascending: false });

    // Calculate urgency/value for each relationship
    const relationshipsWithScores = await Promise.all(
      relationships.map(async (rel) => {
        // Calculate days since last interaction
        const lastInteractionAt = rel.last_interaction_at
          ? new Date(rel.last_interaction_at)
          : null;
        const daysSinceLastInteraction = lastInteractionAt
          ? Math.floor((now.getTime() - lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        // Count overdue actions
        const relationshipActions = (allActions || []).filter(
          (action) => action.person_id === rel.id
        );
        const overdueActions = relationshipActions.filter((action) => {
          const dueDate = new Date(action.due_date);
          dueDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return dueDate < today;
        });

        // Check for urgent email sentiment
        const relationshipEmails = (recentEmails || []).filter(
          (email) => email.person_id === rel.id
        );
        const hasUrgentEmailSentiment = relationshipEmails.some(
          (e) => e.sentiment === "urgent"
        );

        // Check for open loops
        const hasOpenLoops =
          relationshipEmails.some(
            (e) => e.open_loops && Array.isArray(e.open_loops) && e.open_loops.length > 0
          ) || false;

        // Calculate response rate
        const { count: totalActions } = await supabase
          .from("actions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("person_id", rel.id)
          .in("state", ["DONE", "REPLIED", "SENT"]);

        const { count: repliedActions } = await supabase
          .from("actions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("person_id", rel.id)
          .eq("state", "REPLIED");

        const responseRate =
          (totalActions || 0) > 0 ? (repliedActions || 0) / (totalActions || 1) : 0;

        // Check if in OPPORTUNITY state
        const hasDealPotential = rel.relationship_state === "OPPORTUNITY";

        // Calculate urgency/value
        const urgencyValue = calculateUrgencyValue({
          daysSinceLastInteraction,
          overdueActionsCount: overdueActions.length,
          hasUrgentEmailSentiment,
          hasOpenLoops,
          tier: rel.tier,
          responseRate,
          hasDealPotential,
        });

        return {
          id: rel.id,
          name: rel.name,
          quadrant: urgencyValue.quadrant,
          urgency: urgencyValue.urgency,
          value: urgencyValue.value,
          urgencyScore: urgencyValue.urgencyScore,
          valueScore: urgencyValue.valueScore,
          label: urgencyValue.label,
        };
      })
    );

    // Group by quadrant
    const quadrants = {
      "high-high": relationshipsWithScores.filter((r) => r.quadrant === "high-high"),
      "high-low": relationshipsWithScores.filter((r) => r.quadrant === "high-low"),
      "low-high": relationshipsWithScores.filter((r) => r.quadrant === "low-high"),
      "low-low": relationshipsWithScores.filter((r) => r.quadrant === "low-low"),
    };

    return NextResponse.json({ quadrants });
  } catch (error) {
    console.error("Error in urgency-value-matrix endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

