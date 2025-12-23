import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveConnection,
  getActiveConnections,
  getValidAccessToken,
  refreshAccessToken,
  type CalendarConnection,
} from "@/lib/calendar/tokens";
import { fetchGoogleFreeBusy } from "@/lib/calendar/freebusy-google";
import { fetchOutlookFreeBusy } from "@/lib/calendar/freebusy-outlook";
import { getCachedFreeBusy, setCachedFreeBusy } from "@/lib/calendar/cache";
import { aggregateFreeBusyAcrossCalendars, getConfidenceLabel } from "@/lib/calendar/aggregate-freebusy";

type CapacityLevel = "micro" | "light" | "standard" | "heavy" | "default";

/**
 * Calculate capacity level and suggested action count from free minutes.
 *
 * Assumes ~30 minutes per action on average.
 * More realistic thresholds:
 * - 0 minutes: 0 actions (fully booked)
 * - 30 minutes: 1 action
 * - 60 minutes: 2 actions
 * - 90 minutes: 3 actions
 * - 120 minutes: 4 actions
 * - 180 minutes: 6 actions
 * - 240+ minutes: 8 actions
 */
function calculateCapacity(freeMinutes: number | null): {
  level: CapacityLevel;
  suggestedActionCount: number;
} {
  if (freeMinutes === null) {
    return { level: "default", suggestedActionCount: 6 };
  }

  // 0 minutes available = fully booked, no actions
  if (freeMinutes < 1) {
    return { level: "micro", suggestedActionCount: 0 };
  }

  // Calculate based on ~30 minutes per action
  // Round down to be conservative
  const actions = Math.floor(freeMinutes / 30);

  // Cap at 8 actions max
  const actionCount = Math.min(actions, 8);

  // Map to capacity levels
  if (actionCount === 0) {
    return { level: "micro", suggestedActionCount: 0 };
  } else if (actionCount <= 1) {
    return { level: "micro", suggestedActionCount: 1 };
  } else if (actionCount <= 2) {
    return { level: "light", suggestedActionCount: 2 };
  } else if (actionCount <= 3) {
    return { level: "light", suggestedActionCount: 3 };
  } else if (actionCount <= 4) {
    return { level: "standard", suggestedActionCount: 4 };
  } else if (actionCount <= 6) {
    return { level: "standard", suggestedActionCount: 6 };
  } else {
    return { level: "heavy", suggestedActionCount: 8 };
  }
}

/**
 * GET /api/calendar/freebusy?date=YYYY-MM-DD
 *
 * Returns free/busy data for a specific date.
 * Always returns 200 OK with data (falls back to default capacity on error).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          date: new Date().toISOString().split("T")[0],
          freeMinutes: null,
          busySlots: [],
          workingHours: null,
          capacity: "default",
          suggestedActionCount: 6,
          fallback: true,
          message: "Unauthorized. Using default capacity.",
        },
        { status: 200 }
      );
    }

    // Get date from query params (default to today)
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const date = dateParam || new Date().toISOString().split("T")[0];

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        {
          date,
          freeMinutes: null,
          busySlots: [],
          workingHours: null,
          capacity: "default",
          suggestedActionCount: 6,
          fallback: true,
          message: "Invalid date format. Use YYYY-MM-DD.",
        },
        { status: 200 }
      );
    }

    // Get user timezone and working hours (default to UTC and 9-5)
    const { data: userProfile } = await supabase
      .from("users")
      .select("timezone, work_start_time, work_end_time")
      .eq("id", user.id)
      .single();

    const startTimeStr = userProfile?.work_start_time
      ? userProfile.work_start_time.substring(0, 5) // Extract HH:MM from HH:MM:SS
      : "09:00";
    const endTimeStr = userProfile?.work_end_time
      ? userProfile.work_end_time.substring(0, 5) // Extract HH:MM from HH:MM:SS
      : "17:00";

    // Check cache first
    const cached = getCachedFreeBusy(user.id, date);
    if (cached) {
      return NextResponse.json({
        date,
        freeMinutes: cached.freeMinutes,
        busySlots: cached.busySlots,
        workingHours: { start: startTimeStr, end: endTimeStr },
        capacity: cached.capacity,
        suggestedActionCount: cached.suggestedActionCount,
        fallback: false,
      });
    }

    // Get all active calendar connections (multi-calendar support)
    const connections = await getActiveConnections(supabase, user.id);
    if (connections.length === 0) {
      const { level, suggestedActionCount } = calculateCapacity(null);
      return NextResponse.json({
        date,
        freeMinutes: null,
        busySlots: [],
        workingHours: null,
        capacity: level,
        suggestedActionCount,
        fallback: true,
        message: "Calendar not connected. Using default capacity.",
        confidenceLabel: "No calendars available",
        calendarCount: 0,
      });
    }

    const timezone = userProfile?.timezone || "UTC";
    // Convert TIME to HH:MM string (PostgreSQL TIME format is HH:MM:SS)
    const workStartTime = userProfile?.work_start_time
      ? userProfile.work_start_time.substring(0, 5) // Extract HH:MM from HH:MM:SS
      : "09:00";
    const workEndTime = userProfile?.work_end_time
      ? userProfile.work_end_time.substring(0, 5) // Extract HH:MM from HH:MM:SS
      : "17:00";

    // Aggregate free/busy from all calendars
    let aggregatedResult;
    try {
      aggregatedResult = await aggregateFreeBusyAcrossCalendars(
        supabase,
        user.id,
        date,
        timezone,
        workStartTime,
        workEndTime
      );

      // Update last_sync_at for all successfully fetched connections
      // Note: We update all connections, not just successful ones, since we don't track which ones succeeded
      // This is acceptable - last_sync_at is informational
      await Promise.all(
        connections.map((conn) =>
          supabase
            .from("calendar_connections")
            .update({ last_sync_at: new Date().toISOString() })
            .eq("id", conn.id)
        )
      );
    } catch (error) {
      console.error("Failed to aggregate free/busy data:", error);
      const { level, suggestedActionCount } = calculateCapacity(null);
      return NextResponse.json({
        date,
        freeMinutes: null,
        busySlots: [],
        workingHours: null,
        capacity: level,
        suggestedActionCount,
        fallback: true,
        message: "Unable to access calendar. Using default capacity.",
        error: "CALENDAR_FETCH_ERROR",
        confidenceLabel: "No calendars available",
        calendarCount: 0,
      });
    }

    if (!aggregatedResult) {
      const { level, suggestedActionCount } = calculateCapacity(null);
      return NextResponse.json({
        date,
        freeMinutes: null,
        busySlots: [],
        workingHours: null,
        capacity: level,
        suggestedActionCount,
        fallback: true,
        message: "Unable to access calendar. Using default capacity.",
        error: "CALENDAR_FETCH_ERROR",
        confidenceLabel: "No calendars available",
        calendarCount: 0,
      });
    }

    // Calculate capacity
    const { level, suggestedActionCount } = calculateCapacity(
      aggregatedResult.freeMinutes
    );

    // Cache the result
    setCachedFreeBusy(user.id, date, {
      freeMinutes: aggregatedResult.freeMinutes,
      busySlots: aggregatedResult.busySlots,
      capacity: level,
      suggestedActionCount,
    });

    // Generate confidence label
    const confidenceLabel = getConfidenceLabel(aggregatedResult);

    return NextResponse.json({
      date,
      freeMinutes: aggregatedResult.freeMinutes,
      busySlots: aggregatedResult.busySlots,
      workingHours: aggregatedResult.workingHours,
      capacity: level,
      suggestedActionCount,
      fallback: aggregatedResult.calendarCount === 0,
      confidenceLabel,
      calendarCount: aggregatedResult.calendarCount,
      confidence: aggregatedResult.confidence,
    });
  } catch (error) {
    console.error("Free/busy API error:", error);
    const date =
      new URL(request.url).searchParams.get("date") ||
      new Date().toISOString().split("T")[0];
    return NextResponse.json({
      date,
      freeMinutes: null,
      busySlots: [],
      workingHours: null,
      capacity: "default",
      suggestedActionCount: 6,
      fallback: true,
      message: "Unable to access calendar. Using default capacity.",
      error: "INTERNAL_ERROR",
    });
  }
}
