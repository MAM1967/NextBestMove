import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/actions/[id]
 * 
 * Get detailed information about a specific action, including:
 * - Action data (type, state, due_date, notes, etc.)
 * - Related lead/relationship data
 * - Action history (derived from timestamps)
 * - Related actions for same lead
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: actionId } = await params;

    // Fetch action (without join to avoid PostgREST ambiguity)
    // Include completion tracking fields
    const { data: action, error: actionError } = await supabase
      .from("actions")
      .select("*, next_call_calendared_at, replied_to_email_at, got_response_at, got_response_notes")
      .eq("id", actionId)
      .eq("user_id", user.id)
      .single();

    if (actionError || !action) {
      return NextResponse.json(
        { error: "Action not found" },
        { status: 404 }
      );
    }

    // Fetch lead separately if action has a person_id
    let lead: any = null;
    if (action.person_id) {
      const { data: fetchedLead, error: leadError } = await supabase
        .from("leads")
        .select("id, name, linkedin_url, email, phone_number, url, notes, status, relationship_state, state_updated_at")
        .eq("id", action.person_id)
        .eq("user_id", user.id)
        .single();

      if (leadError) {
        console.error("Error fetching lead for action:", leadError);
        // Continue without lead if there's an error fetching it
      } else {
        lead = fetchedLead;
      }
    }

    // Derive action history from timestamps
    const history: Array<{
      event: string;
      timestamp: string;
      state?: string;
    }> = [];

    // Created event
    if (action.created_at) {
      history.push({
        event: "Created",
        timestamp: action.created_at,
        state: action.state,
      });
    }

    // State changes (we infer from updated_at and completed_at)
    if (action.updated_at && action.updated_at !== action.created_at) {
      // If state is not NEW and updated_at differs from created_at, there was a state change
      if (action.state !== "NEW") {
        history.push({
          event: `State changed to ${action.state}`,
          timestamp: action.updated_at,
          state: action.state,
        });
      }
    }

    // Completed event
    if (action.completed_at) {
      history.push({
        event: "Completed",
        timestamp: action.completed_at,
        state: action.state,
      });
    }

    // Sort history by timestamp
    history.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Fetch related actions for same lead (if action has a person_id)
    let relatedActions: any[] = [];
    if (action.person_id) {
      const { data: related, error: relatedError } = await supabase
        .from("actions")
        .select("id, action_type, state, due_date, description, created_at, completed_at")
        .eq("user_id", user.id)
        .eq("person_id", action.person_id)
        .neq("id", actionId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!relatedError && related) {
        relatedActions = related;
      }
    }

    return NextResponse.json({
      action: {
        ...action,
        leads: lead, // Attach the fetched lead
        history,
        relatedActions,
      },
    });
  } catch (error) {
    console.error("Error fetching action details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
