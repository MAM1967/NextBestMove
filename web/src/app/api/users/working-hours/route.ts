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
    const { workStartTime, workEndTime } = body;

    // Validate input format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (
      typeof workStartTime !== "string" ||
      typeof workEndTime !== "string" ||
      !timeRegex.test(workStartTime) ||
      !timeRegex.test(workEndTime)
    ) {
      return NextResponse.json(
        {
          error: "Invalid time format",
          details: "Times must be in HH:MM format (e.g., '09:30', '17:30')",
        },
        { status: 400 }
      );
    }

    // Parse and validate times
    const [startHours, startMinutes] = workStartTime.split(":").map(Number);
    const [endHours, endMinutes] = workEndTime.split(":").map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    if (endTotalMinutes <= startTotalMinutes) {
      return NextResponse.json(
        {
          error: "Invalid working hours",
          details: "End time must be after start time",
        },
        { status: 400 }
      );
    }

    // Update user's working hours (PostgreSQL TIME format is HH:MM:SS)
    const { error } = await supabase
      .from("users")
      .update({
        work_start_time: `${workStartTime}:00`,
        work_end_time: `${workEndTime}:00`,
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
      workStartTime,
      workEndTime,
    });
  } catch (error) {
    console.error("Working hours API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

