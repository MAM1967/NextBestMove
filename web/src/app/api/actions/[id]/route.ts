import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getActionDetails } from "@/lib/actions/get-action-details";

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

    // Use extracted business logic function
    const result = await getActionDetails(supabase, user.id, actionId);

    if (!result) {
      return NextResponse.json(
        { error: "Action not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching action details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
