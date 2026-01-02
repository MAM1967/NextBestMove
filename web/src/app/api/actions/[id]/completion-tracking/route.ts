import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * PATCH /api/actions/[id]/completion-tracking
 * 
 * Track concrete completion events on an action:
 * - next_call_calendared: User calendared a next call
 * - replied_to_email: User replied to email with topics
 * - got_response: User received a response (with optional notes)
 */
export async function PATCH(
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
    const { event_type, notes } = body;

    if (!event_type || !["next_call_calendared", "replied_to_email", "got_response"].includes(event_type)) {
      return NextResponse.json(
        { error: "Invalid event_type" },
        { status: 400 }
      );
    }

    // Verify action belongs to user
    const { data: action, error: actionError } = await supabase
      .from("actions")
      .select("id, user_id")
      .eq("id", actionId)
      .eq("user_id", user.id)
      .single();

    if (actionError || !action) {
      return NextResponse.json(
        { error: "Action not found" },
        { status: 404 }
      );
    }

    // Update the appropriate field
    const updateData: any = {};
    const now = new Date().toISOString();

    if (event_type === "next_call_calendared") {
      updateData.next_call_calendared_at = now;
    } else if (event_type === "replied_to_email") {
      updateData.replied_to_email_at = now;
    } else if (event_type === "got_response") {
      updateData.got_response_at = now;
      if (notes) {
        updateData.got_response_notes = notes;
      }
    }

    const { error: updateError } = await supabase
      .from("actions")
      .update(updateData)
      .eq("id", actionId);

    if (updateError) {
      console.error("Error updating completion tracking:", updateError);
      return NextResponse.json(
        { error: "Failed to update completion tracking" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in completion-tracking endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

