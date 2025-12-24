import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * PATCH /api/actions/[id]/promise
 * 
 * Set or unset a promised follow-up date on an action.
 * 
 * Body:
 * - promised_due_at: ISO timestamp string or null to clear
 *   - Can be "EOD" (end of today), "this_week" (end of week), or ISO timestamp
 */
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
    let { promised_due_at } = body;

    // Handle special values: "EOD" (end of today) or "this_week" (end of week)
    if (promised_due_at === "EOD") {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      promised_due_at = today.toISOString();
    } else if (promised_due_at === "this_week") {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + daysUntilSunday);
      endOfWeek.setHours(23, 59, 59, 999);
      promised_due_at = endOfWeek.toISOString();
    } else if (promised_due_at === null || promised_due_at === "") {
      // Clear the promise
      promised_due_at = null;
    } else if (promised_due_at) {
      // Validate ISO timestamp format
      const date = new Date(promised_due_at);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format. Use ISO timestamp, 'EOD', or 'this_week'" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: {
      promised_due_at: string | null;
    } = {
      promised_due_at: promised_due_at || null,
    };

    const { data, error } = await supabase
      .from("actions")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(
        `
        *,
        leads (
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
      console.error("Error updating action promise:", error);
      return NextResponse.json(
        { error: "Failed to update action promise" },
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

