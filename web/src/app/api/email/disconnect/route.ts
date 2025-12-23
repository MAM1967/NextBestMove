import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * DELETE /api/email/disconnect
 * 
 * Disconnects an email connection for the authenticated user.
 * Query param: ?provider=gmail or ?provider=outlook
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const { searchParams } = new URL(request.url);
  const providerParam = searchParams.get("provider");

  // If provider is specified, disconnect only that provider
  // Otherwise, disconnect all email connections
  if (providerParam && providerParam !== "gmail" && providerParam !== "outlook") {
    return NextResponse.json(
      { error: "Invalid provider. Must be 'gmail' or 'outlook'" },
      { status: 400 }
    );
  }

  const updateData = {
    status: "disconnected" as const,
    access_token: null,
    refresh_token: "",
    error_message: null,
  };

  let query = supabase
    .from("email_connections")
    .update(updateData)
    .eq("user_id", user.id);

  if (providerParam) {
    query = query.eq("provider", providerParam);
  }

  const { error } = await query;

    if (error) {
      console.error("Error disconnecting email:", error);
      return NextResponse.json(
        { error: "Failed to disconnect email" },
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

