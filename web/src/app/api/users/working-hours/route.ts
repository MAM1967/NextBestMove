import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/users/working-hours
 * Update user's working hours
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
    const { workStartHour, workEndHour } = body;

    // Validate input
    if (
      typeof workStartHour !== "number" ||
      typeof workEndHour !== "number" ||
      workStartHour < 0 ||
      workStartHour > 23 ||
      workEndHour < 0 ||
      workEndHour > 23 ||
      workEndHour <= workStartHour
    ) {
      return NextResponse.json(
        {
          error: "Invalid working hours",
          details:
            "Start hour and end hour must be between 0-23, and end hour must be after start hour",
        },
        { status: 400 }
      );
    }

    // Update user's working hours
    const { error } = await supabase
      .from("users")
      .update({
        work_start_hour: workStartHour,
        work_end_hour: workEndHour,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Failed to update working hours:", error);
      return NextResponse.json(
        { error: "Failed to update working hours", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      workStartHour,
      workEndHour,
    });
  } catch (error) {
    console.error("Working hours API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

