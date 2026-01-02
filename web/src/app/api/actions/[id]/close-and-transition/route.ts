import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { determineNextState } from "@/lib/relationships/state-machine";

/**
 * POST /api/actions/[id]/close-and-transition
 * 
 * Closes an action and transitions the relationship through the state machine.
 * Creates new actions if needed and moves notes/information forward.
 * 
 * State transitions:
 * - Unengaged -> Outreach -> Active Conversation
 * - Active Conversation (Post-Call Actions <-> Follow-Up) -> Resolution Reached?
 *   - Yes -> Opportunity/Client
 *   - No -> Warm but Passive
 * - Warm but Passive -> Nurture -> Dormant -> (signal) -> Warm/Active again
 */
export async function POST(
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
    const body = await request.json();
    const { notes, completion_events } = body;

    // Fetch action with relationship
    const { data: action, error: actionError } = await supabase
      .from("actions")
      .select("*, leads(*)")
      .eq("id", actionId)
      .eq("user_id", user.id)
      .single();

    if (actionError || !action) {
      return NextResponse.json(
        { error: "Action not found" },
        { status: 404 }
      );
    }

    if (!action.person_id || !action.leads) {
      return NextResponse.json(
        { error: "Action must be associated with a relationship" },
        { status: 400 }
      );
    }

    const relationship = action.leads;

    // Update completion tracking if provided
    if (completion_events) {
      const updateData: any = {};
      if (completion_events.next_call_calendared_at) {
        updateData.next_call_calendared_at = completion_events.next_call_calendared_at;
      }
      if (completion_events.replied_to_email_at) {
        updateData.replied_to_email_at = completion_events.replied_to_email_at;
      }
      if (completion_events.got_response_at) {
        updateData.got_response_at = completion_events.got_response_at;
        if (completion_events.got_response_notes) {
          updateData.got_response_notes = completion_events.got_response_notes;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from("actions")
          .update(updateData)
          .eq("id", actionId);
      }
    }

    // Update action notes if provided
    if (notes) {
      await supabase
        .from("actions")
        .update({ notes })
        .eq("id", actionId);
    }

    // Determine next relationship state based on action type and completion events
    const currentState = (relationship.relationship_state || "UNENGAGED") as
      | "UNENGAGED"
      | "ACTIVE_CONVERSATION"
      | "OPPORTUNITY"
      | "WARM_BUT_PASSIVE"
      | "DORMANT";

    // Build context for state machine
    const context = {
      lastInteractionAt: relationship.last_interaction_at
        ? new Date(relationship.last_interaction_at)
        : null,
      overdueActionsCount: 0, // Will be calculated if needed
      emailSignals: [],
      calendarEvents: [],
      actionType: action.action_type,
      completionEvents: completion_events || {},
    };

    // Determine next state
    const nextState = determineNextState(currentState, context, action.action_type as any);

    // Update relationship state if it changed
    if (nextState !== currentState) {
      await supabase
        .from("leads")
        .update({
          relationship_state: nextState,
          state_updated_at: new Date().toISOString(),
        })
        .eq("id", relationship.id);
    }

    // Mark action as completed
    await supabase
      .from("actions")
      .update({
        state: "DONE",
        completed_at: new Date().toISOString(),
      })
      .eq("id", actionId);

    // Create new action if needed based on state transition
    // For example, if transitioning to ACTIVE_CONVERSATION, might create a FOLLOW_UP
    let newActionId: string | null = null;
    if (nextState === "ACTIVE_CONVERSATION" && action.action_type === "OUTREACH") {
      // Create a FOLLOW_UP action
      const followUpDueDate = new Date();
      followUpDueDate.setDate(followUpDueDate.getDate() + 7); // 7 days from now

      const { data: newAction, error: newActionError } = await supabase
        .from("actions")
        .insert({
          user_id: user.id,
          person_id: relationship.id,
          action_type: "FOLLOW_UP",
          state: "NEW",
          due_date: followUpDueDate.toISOString().split("T")[0],
          description: `Follow up with ${relationship.name}`,
          auto_created: true,
        })
        .select("id")
        .single();

      if (!newActionError && newAction) {
        newActionId = newAction.id;
      }
    }

    return NextResponse.json({
      success: true,
      nextState,
      newActionId,
    });
  } catch (error) {
    console.error("Error in close-and-transition endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

