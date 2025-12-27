import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * PATCH /api/actions/[id]/estimated-minutes
 * 
 * Update the estimated_minutes field on an action.
 * 
 * Body:
 * - estimated_minutes: number | null (must be > 0 if provided, or null to clear)
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
    const { estimated_minutes } = body;

    // Validate estimated_minutes
    if (estimated_minutes !== null && estimated_minutes !== undefined) {
      const minutes = Number(estimated_minutes);
      if (isNaN(minutes) || minutes <= 0) {
        return NextResponse.json(
          { error: "estimated_minutes must be a positive number" },
          { status: 400 }
        );
      }
    }

    // Verify action belongs to user
    const { data: existingAction, error: fetchError } = await supabase
      .from("actions")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingAction) {
      return NextResponse.json(
        { error: "Action not found" },
        { status: 404 }
      );
    }

    if (existingAction.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update estimated_minutes
    const { data, error } = await supabase
      .from("actions")
      .update({
        estimated_minutes: estimated_minutes === null || estimated_minutes === undefined ? null : Number(estimated_minutes),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating action estimated_minutes:", error);
      return NextResponse.json(
        { error: "Failed to update action estimated_minutes" },
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




