import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/leads/[id]/notes-summary
 * 
 * Computes Notes Summary for a relationship including:
 * - Total interactions (recent window, e.g., last 30 days)
 * - Last interaction date
 * - Next suggested follow-up
 * - Pending/post-call action items
 * - Key research topics (from notes)
 * - Momentum snapshot
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify relationship belongs to user
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, name, last_interaction_at, next_touch_due_at, momentum_score, momentum_trend, notes")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (leadError || !lead) {
      if (leadError?.code === "PGRST116") {
        return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
      }
      console.error("Error fetching relationship:", leadError);
      return NextResponse.json(
        { error: "Failed to fetch relationship" },
        { status: 500 }
      );
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all actions for this relationship
    const { data: actions, error: actionsError } = await supabase
      .from("actions")
      .select("id, action_type, state, completed_at, due_date, notes, description, created_at")
      .eq("person_id", id)
      .order("completed_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (actionsError) {
      console.error("Error fetching actions:", actionsError);
      return NextResponse.json(
        { error: "Failed to fetch actions" },
        { status: 500 }
      );
    }

    // Compute aggregates
    const completedActions = actions?.filter(
      (a) => a.completed_at && (a.state === "DONE" || a.state === "SENT" || a.state === "REPLIED")
    ) || [];

    // Total interactions in last 30 days
    const recentInteractions = completedActions.filter((a) => {
      if (!a.completed_at) return false;
      const completedDate = new Date(a.completed_at);
      return completedDate >= thirtyDaysAgo;
    });

    // Last interaction date
    const lastInteraction = completedActions[0]?.completed_at || lead.last_interaction_at || null;

    // Pending action items (NEW, SENT, SNOOZED states)
    const pendingActions = actions?.filter(
      (a) => a.state === "NEW" || a.state === "SENT" || a.state === "SNOOZED"
    ) || [];

    // Post-call action items (POST_CALL type, pending)
    const postCallActions = pendingActions.filter(
      (a) => a.action_type === "POST_CALL"
    );

    // Overdue actions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueActions = pendingActions.filter((a) => {
      const dueDate = new Date(a.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    });

    // Key research topics (extract from notes - simple keyword extraction)
    // For v1, we'll just show if there are notes with certain keywords
    const researchTopics: string[] = [];
    const allNotes = [
      lead.notes,
      ...(actions?.map((a) => a.notes).filter(Boolean) || []),
    ].filter(Boolean) as string[];

    // Simple keyword detection for research topics
    const researchKeywords = ["research", "company", "industry", "news", "article", "linkedin", "profile"];
    allNotes.forEach((note) => {
      const lowerNote = note.toLowerCase();
      researchKeywords.forEach((keyword) => {
        if (lowerNote.includes(keyword) && !researchTopics.includes(keyword)) {
          researchTopics.push(keyword);
        }
      });
    });

    // Momentum snapshot
    const momentumSnapshot = {
      score: lead.momentum_score || null,
      trend: lead.momentum_trend || "unknown",
      // Compute trend from recent interactions if not set
      recentActivity: recentInteractions.length,
      daysSinceLastInteraction: lastInteraction
        ? Math.floor((now.getTime() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24))
        : null,
    };

    // Next suggested follow-up
    const nextFollowUp = lead.next_touch_due_at || null;

    const summary = {
      relationshipId: id,
      relationshipName: lead.name,
      // Interaction metrics
      totalInteractions: completedActions.length,
      recentInteractions: recentInteractions.length,
      lastInteractionDate: lastInteraction,
      // Action items
      pendingActionsCount: pendingActions.length,
      overdueActionsCount: overdueActions.length,
      postCallActionsCount: postCallActions.length,
      pendingActions: pendingActions.slice(0, 5).map((a) => ({
        id: a.id,
        type: a.action_type,
        description: a.description || null,
        dueDate: a.due_date,
        state: a.state,
      })),
      postCallActions: postCallActions.slice(0, 3).map((a) => ({
        id: a.id,
        description: a.description || null,
        dueDate: a.due_date,
      })),
      // Research topics
      researchTopics: researchTopics.slice(0, 5),
      // Momentum
      momentum: momentumSnapshot,
      // Next follow-up
      nextFollowUpDate: nextFollowUp,
      // Suggested next action (from decision engine if available)
      suggestedNextAction: null, // Can be populated from decision engine later
    };

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

