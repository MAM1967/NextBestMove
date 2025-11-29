import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/users/time-format
 * Update user's time format preference (12h or 24h)
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
    const { timeFormat } = body;

    // Validate input
    if (timeFormat !== "12h" && timeFormat !== "24h") {
      return NextResponse.json(
        {
          error: "Invalid time format",
          details: "Time format must be '12h' or '24h'",
        },
        { status: 400 }
      );
    }

    // Update user's time format preference
    const { error } = await supabase
      .from("users")
      .update({
        time_format_preference: timeFormat,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Failed to update time format:", error);
      return NextResponse.json(
        { error: "Failed to update time format", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      timeFormat,
    });
  } catch (error) {
    console.error("Time format API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

