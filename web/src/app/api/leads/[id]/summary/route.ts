import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/leads/[id]/summary - Get relationship summary data
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

    // Get the lead/relationship
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all actions for this relationship
    const { data: allActions, error: actionsError } = await supabase
      .from("actions")
      .select("*")
      .eq("person_id", id)
      .eq("user_id", user.id)
      .order("due_date", { ascending: false });

    if (actionsError) {
      console.error("Error fetching actions:", actionsError);
      return NextResponse.json(
        { error: "Failed to fetch actions" },
        { status: 500 }
      );
    }

    const actions = allActions || [];

    // Calculate interactions (completed actions in last 30 days)
    const recentActions = actions.filter(
      (action) =>
        action.completed_at &&
        new Date(action.completed_at) >= thirtyDaysAgo &&
        (action.state === "DONE" || action.state === "REPLIED" || action.state === "SENT")
    );
    const totalInteractions30Days = recentActions.length;

    // Get last interaction date (from lead.last_interaction_at or computed)
    const lastInteractionAt = lead.last_interaction_at || null;

    // Get next suggested follow-up (from lead.next_touch_due_at)
    const nextTouchDueAt = lead.next_touch_due_at || null;

    // Get pending actions (NEW, SENT, SNOOZED)
    const pendingActions = actions.filter(
      (action) =>
        action.state === "NEW" || action.state === "SENT" || action.state === "SNOOZED"
    );

    // Get post-call actions (POST_CALL or CALL_PREP that are pending)
    const postCallActions = actions.filter(
      (action) =>
        (action.action_type === "POST_CALL" || action.action_type === "CALL_PREP") &&
        (action.state === "NEW" || action.state === "SENT" || action.state === "SNOOZED")
    );

    // Extract key research topics from notes
    // Simple keyword extraction: find common words/phrases
    const extractResearchTopics = (notes: string | null | undefined): string[] => {
      if (!notes) return [];
      
      // Extract words (3+ characters, not common stop words)
      const stopWords = new Set([
        "the", "and", "for", "are", "but", "not", "you", "all", "can", "her", "was", "one", "our", "out", "day", "get", "has", "him", "his", "how", "its", "may", "new", "now", "old", "see", "two", "who", "way", "use", "her", "she", "him", "his", "its", "my", "our", "the", "this", "that", "these", "those", "a", "an", "as", "at", "be", "by", "do", "go", "if", "in", "is", "it", "me", "no", "of", "on", "or", "so", "to", "up", "we"
      ]);
      
      const words = notes
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 3 && !stopWords.has(word));
      
      // Count word frequency
      const wordCounts = new Map<string, number>();
      words.forEach((word) => {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      });
      
      // Get top 5 most frequent words
      const sortedWords = Array.from(wordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
      
      return sortedWords;
    };

    const leadNotesTopics = extractResearchTopics(lead.notes);
    const actionNotesTopics = actions
      .flatMap((action) => extractResearchTopics(action.notes))
      .filter((topic, index, self) => self.indexOf(topic) === index) // Unique
      .slice(0, 5);
    
    // Combine and deduplicate topics
    const allTopics = [...new Set([...leadNotesTopics, ...actionNotesTopics])].slice(0, 5);

    // Momentum snapshot (from lead fields)
    const momentumScore = lead.momentum_score || null;
    const momentumTrend = lead.momentum_trend || "unknown";

    return NextResponse.json({
      summary: {
        totalInteractions30Days,
        lastInteractionAt,
        nextTouchDueAt,
        pendingActions: pendingActions.slice(0, 10), // Top 10 pending
        postCallActions: postCallActions.slice(0, 10), // Top 10 post-call
        researchTopics: allTopics,
        momentumScore,
        momentumTrend,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

