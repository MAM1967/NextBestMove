import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/actions/[id]/notes - Add or update notes on an action
export async function POST(
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
    const { note } = body;

    // Validation
    if (!note || typeof note !== "string") {
      return NextResponse.json(
        { error: "Note is required and must be a string" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("actions")
      .update({
        notes: note.trim() || null,
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
      console.error("Error updating action notes:", error);
      return NextResponse.json(
        { error: "Failed to update action notes" },
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


