import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { detectStalledConversation } from "@/lib/leads/channel-nudges";

/**
 * GET /api/leads/stalled-conversations
 * 
 * Returns list of stalled conversations that need nudges.
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

    // Fetch active relationships with preferred channel set
    const { data: relationships, error: relError } = await supabase
      .from("leads")
      .select("id, name, preferred_channel, last_interaction_at, cadence_days")
      .eq("user_id", user.id)
      .eq("status", "ACTIVE")
      .not("preferred_channel", "is", null)
      .not("last_interaction_at", "is", null);

    if (relError) {
      console.error("Error fetching relationships:", relError);
      return NextResponse.json(
        { error: "Failed to fetch relationships" },
        { status: 500 }
      );
    }

    if (!relationships || relationships.length === 0) {
      return NextResponse.json({ stalledConversations: [] });
    }

    // Get pending actions count per relationship
    const relationshipIds = relationships.map((r) => r.id);
    const { data: actions } = await supabase
      .from("actions")
      .select("person_id")
      .eq("user_id", user.id)
      .in("person_id", relationshipIds)
      .in("state", ["NEW", "SENT"]); // Actions awaiting response

    // Count pending actions per relationship
    const pendingActionsCount = new Map<string, number>();
    (actions || []).forEach((action) => {
      if (action.person_id) {
        const count = pendingActionsCount.get(action.person_id) || 0;
        pendingActionsCount.set(action.person_id, count + 1);
      }
    });

    // Detect stalled conversations
    const stalledConversations = relationships
      .map((rel) => {
        const stalled = detectStalledConversation(
          {
            id: rel.id,
            name: rel.name,
            preferred_channel: rel.preferred_channel as any,
            last_interaction_at: rel.last_interaction_at,
            cadence_days: rel.cadence_days,
          },
          pendingActionsCount.get(rel.id) || 0
        );
        return stalled;
      })
      .filter((stalled): stalled is NonNullable<typeof stalled> => stalled !== null);

    return NextResponse.json({ stalledConversations });
  } catch (error) {
    console.error("Error fetching stalled conversations:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch stalled conversations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}






