import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveConnection, getValidAccessToken } from "@/lib/calendar/tokens";
import { fetchGoogleFreeBusy } from "@/lib/calendar/freebusy-google";
import { fetchOutlookFreeBusy } from "@/lib/calendar/freebusy-outlook";
import {
  getCachedFreeBusy,
  setCachedFreeBusy,
} from "@/lib/calendar/cache";

type CapacityLevel = "micro" | "light" | "standard" | "heavy" | "default";

/**
 * Calculate capacity level and suggested action count from free minutes.
 */
function calculateCapacity(freeMinutes: number | null): {
  level: CapacityLevel;
  suggestedActionCount: number;
} {
  if (freeMinutes === null || freeMinutes < 30) {
    return { level: "micro", suggestedActionCount: 1 };
  } else if (freeMinutes < 60) {
    return { level: "light", suggestedActionCount: 3 };
  } else if (freeMinutes < 120) {
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
export async function GET(request: Request) {
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

    // Check cache first
    const cached = getCachedFreeBusy(user.id, date);
    if (cached) {
      return NextResponse.json({
        date,
        freeMinutes: cached.freeMinutes,
        busySlots: cached.busySlots,
        workingHours: { start: "09:00", end: "17:00" },
        capacity: cached.capacity,
        suggestedActionCount: cached.suggestedActionCount,
        fallback: false,
      });
    }

    // Get active calendar connection
    const connection = await getActiveConnection(supabase, user.id);
    if (!connection) {
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
      });
    }

    // Get valid access token (refresh if needed)
    const accessToken = await getValidAccessToken(supabase, connection);
    if (!accessToken) {
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
      });
    }

    // Get user timezone (default to UTC)
    const { data: userProfile } = await supabase
      .from("users")
      .select("timezone")
      .eq("id", user.id)
      .single();

    const timezone = userProfile?.timezone || "UTC";

    // Fetch free/busy data from provider
    let freeBusyResult;
    try {
      if (connection.provider === "google") {
        freeBusyResult = await fetchGoogleFreeBusy(accessToken, date, timezone);
      } else if (connection.provider === "outlook") {
        freeBusyResult = await fetchOutlookFreeBusy(accessToken, date, timezone);
      } else {
        throw new Error(`Unsupported provider: ${connection.provider}`);
      }

      // Update last_sync_at
      await supabase
        .from("calendar_connections")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", connection.id);
    } catch (error) {
      console.error("Failed to fetch free/busy data:", error);
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
      });
    }

    // Calculate capacity
    const { level, suggestedActionCount } = calculateCapacity(
      freeBusyResult.freeMinutes
    );

    // Cache the result
    setCachedFreeBusy(user.id, date, {
      freeMinutes: freeBusyResult.freeMinutes,
      busySlots: freeBusyResult.busySlots,
      capacity: level,
      suggestedActionCount,
    });

    return NextResponse.json({
      date,
      freeMinutes: freeBusyResult.freeMinutes,
      busySlots: freeBusyResult.busySlots,
      workingHours: freeBusyResult.workingHours,
      capacity: level,
      suggestedActionCount,
      fallback: false,
    });
  } catch (error) {
    console.error("Free/busy API error:", error);
    const date = new URL(request.url).searchParams.get("date") || new Date().toISOString().split("T")[0];
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

