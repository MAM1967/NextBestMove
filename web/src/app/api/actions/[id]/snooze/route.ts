import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// PATCH /api/actions/[id]/snooze - Snooze an action
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
    const { snooze_until } = body;

    // Validation
    if (!snooze_until) {
      return NextResponse.json(
        { error: "snooze_until is required" },
        { status: 400 }
      );
    }

    // Validate date is in the future
    const snoozeDate = new Date(snooze_until);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (snoozeDate < today) {
      return NextResponse.json(
        { error: "Snooze date must be today or in the future" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("actions")
      .update({
        state: "SNOOZED",
        snooze_until: snooze_until,
      })
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
      console.error("Error snoozing action:", error);
      return NextResponse.json(
        { error: "Failed to snooze action" },
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



