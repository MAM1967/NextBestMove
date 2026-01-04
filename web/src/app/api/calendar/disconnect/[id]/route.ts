import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/calendar/disconnect/[id]
 *
 * Disconnects a specific calendar connection by ID.
 * Allows users to disconnect individual calendars when multiple are connected.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the connection belongs to the user
  const { data: connection, error: fetchError } = await supabase
    .from("calendar_connections")
    .select("id, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !connection) {
    return NextResponse.json(
      { error: "Calendar connection not found" },
      { status: 404 }
    );
  }

  // Delete the specific connection
  const { error } = await supabase
    .from("calendar_connections")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to disconnect calendar:", error);
    return NextResponse.json(
      { error: "Failed to disconnect calendar" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

