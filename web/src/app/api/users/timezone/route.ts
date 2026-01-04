import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/users/timezone
 * 
 * Returns the current user's timezone setting.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userProfile, error } = await supabase
      .from("users")
      .select("timezone")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching user timezone:", error);
      return NextResponse.json(
        { error: "Failed to fetch timezone" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      timezone: userProfile?.timezone || "America/New_York",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/timezone
 * 
 * Updates the current user's timezone setting.
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { timezone } = body;

    if (!timezone || typeof timezone !== "string") {
      return NextResponse.json(
        { error: "Timezone is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate it's a valid IANA timezone identifier
    // Basic validation - check if it contains a slash (IANA format)
    if (!timezone.includes("/")) {
      return NextResponse.json(
        { error: "Invalid timezone format. Must be an IANA timezone identifier (e.g., America/New_York)" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ timezone })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating timezone:", updateError);
      return NextResponse.json(
        { error: "Failed to update timezone" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, timezone });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
