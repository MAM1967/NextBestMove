import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// PATCH /api/pins/[id]/status - Update pin status (snooze, archive, restore)
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
    const { status, snooze_until } = body;

    // Validation
    if (!status || !["ACTIVE", "SNOOZED", "ARCHIVED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be ACTIVE, SNOOZED, or ARCHIVED" },
        { status: 400 }
      );
    }

    // If snoozing, snooze_until is required
    if (status === "SNOOZED" && !snooze_until) {
      return NextResponse.json(
        { error: "snooze_until is required when status is SNOOZED" },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: {
      status: string;
      snooze_until?: string | null;
    } = {
      status,
    };

    if (status === "SNOOZED") {
      updateData.snooze_until = snooze_until;
    } else {
      // Clear snooze_until when not snoozed
      updateData.snooze_until = null;
    }

    const { data, error } = await supabase
      .from("person_pins")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Pin not found" }, { status: 404 });
      }
      console.error("Error updating pin status:", error);
      return NextResponse.json(
        { error: "Failed to update pin status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ pin: data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}






