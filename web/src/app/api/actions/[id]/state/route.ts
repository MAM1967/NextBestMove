import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// PATCH /api/actions/[id]/state - Update action state
export async function PATCH(
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

    const body = await request.json();
    const { state } = body;

    // Validation
    const validStates = ["NEW", "SENT", "REPLIED", "SNOOZED", "DONE", "ARCHIVED"];
    if (!state || !validStates.includes(state)) {
      return NextResponse.json(
        { error: `Invalid state. Must be one of: ${validStates.join(", ")}` },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: {
      state: string;
      completed_at?: string | null;
      snooze_until?: string | null;
    } = {
      state,
    };

    // Set completed_at when marking as DONE or REPLIED
    if (state === "DONE" || state === "REPLIED") {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = null;
    }

    // Clear snooze_until when not snoozed
    if (state !== "SNOOZED") {
      updateData.snooze_until = null;
    }

    const { data, error } = await supabase
      .from("actions")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(
        `
        *,
        person_pins (
          id,
          name,
          url,
          notes
        )
      `
      )
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Action not found" }, { status: 404 });
      }
      console.error("Error updating action state:", error);
      return NextResponse.json(
        { error: "Failed to update action state" },
        { status: 500 }
      );
    }

    return NextResponse.json({ action: data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


