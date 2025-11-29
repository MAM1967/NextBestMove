import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// PATCH /api/content-prompts/[id] - Update prompt status (archive, mark as posted, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await request.json();

    if (!status || !["DRAFT", "POSTED", "ARCHIVED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be DRAFT, POSTED, or ARCHIVED" },
        { status: 400 }
      );
    }

    // Verify the prompt belongs to the user
    const { data: prompt, error: fetchError } = await supabase
      .from("content_prompts")
      .select("id, user_id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !prompt) {
      return NextResponse.json(
        { error: "Content prompt not found" },
        { status: 404 }
      );
    }

    // Update the status
    const { data: updated, error: updateError } = await supabase
      .from("content_prompts")
      .update({ status })
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating content prompt:", updateError);
      return NextResponse.json(
        { error: "Failed to update content prompt" },
        { status: 500 }
      );
    }

    return NextResponse.json({ prompt: updated });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/content-prompts/[id] - Delete a content prompt
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the prompt belongs to the user and delete
    const { error: deleteError } = await supabase
      .from("content_prompts")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting content prompt:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete content prompt" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

