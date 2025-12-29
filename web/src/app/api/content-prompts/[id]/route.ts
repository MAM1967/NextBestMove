import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * PATCH /api/content-prompts/[id]
 * Update a content prompt (e.g., save edited version)
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
    const { content, user_edited } = body;

    // Verify the prompt belongs to the user
    const { data: existingPrompt, error: fetchError } = await supabase
      .from("content_prompts")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingPrompt) {
      return NextResponse.json(
        { error: "Content prompt not found" },
        { status: 404 }
      );
    }

    // Update the prompt
    const updateData: {
      content?: string;
      user_edited?: boolean;
      edited_text?: string;
    } = {};
    if (content !== undefined) {
      updateData.content = content;
    }
    if (user_edited !== undefined) {
      updateData.user_edited = user_edited;
      if (user_edited && content) {
        updateData.edited_text = content; // Store edited version for voice learning
      }
    }

    const { data, error } = await supabase
      .from("content_prompts")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating content prompt:", error);
      return NextResponse.json(
        { error: "Failed to update content prompt" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, prompt: data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
