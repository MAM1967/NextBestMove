import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// PUT /api/actions/[id] - Update an action
export async function PUT(
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
    const { due_date, notes, description, promised_due_at } = body;

    // Build update object (only include fields that are provided)
    const updateData: {
      due_date?: string;
      notes?: string | null;
      description?: string | null;
      promised_due_at?: string | null;
    } = {};

    if (due_date) {
      updateData.due_date = due_date;
    }

    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    if (description !== undefined) {
      updateData.description = description || null;
    }

    if (promised_due_at !== undefined) {
      updateData.promised_due_at = promised_due_at || null;
    }

    // Validate that at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "At least one field (due_date, notes, description, promised_due_at) must be provided" },
        { status: 400 }
      );
    }

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
      console.error("Error updating action:", error);
      return NextResponse.json(
        { error: "Failed to update action" },
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

