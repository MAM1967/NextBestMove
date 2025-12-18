import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveConnection,
  getValidAccessToken,
  refreshAccessToken,
} from "@/lib/calendar/tokens";
import { fetchGoogleFreeBusy } from "@/lib/calendar/freebusy-google";
import { fetchOutlookFreeBusy } from "@/lib/calendar/freebusy-outlook";
import { getCachedFreeBusy, setCachedFreeBusy } from "@/lib/calendar/cache";

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
    // Pass hostname to ensure staging workaround is applied during refresh
    const accessToken = await getValidAccessToken(supabase, connection, request.nextUrl.hostname);
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

    const timezone = userProfile?.timezone || "UTC";
    // Convert TIME to HH:MM string (PostgreSQL TIME format is HH:MM:SS)
    const workStartTime = userProfile?.work_start_time
      ? userProfile.work_start_time.substring(0, 5) // Extract HH:MM from HH:MM:SS
      : "09:00";
    const workEndTime = userProfile?.work_end_time
      ? userProfile.work_end_time.substring(0, 5) // Extract HH:MM from HH:MM:SS
      : "17:00";

    // Fetch free/busy data from provider with retry logic for 401 errors
    let freeBusyResult;
    try {
      try {
        if (connection.provider === "google") {
          freeBusyResult = await fetchGoogleFreeBusy(
            accessToken,
            date,
            timezone,
            workStartTime,
            workEndTime
          );
        } else if (connection.provider === "outlook") {
          freeBusyResult = await fetchOutlookFreeBusy(
            accessToken,
            date,
            timezone,
            workStartTime,
            workEndTime
          );
        } else {
          throw new Error(`Unsupported provider: ${connection.provider}`);
        }
      } catch (error: unknown) {
        // If we get an auth error (401/403), try refreshing the token and retrying once
        const errorObj = error as { isAuthError?: boolean };
        if (errorObj?.isAuthError) {
          console.log(
            `[FreeBusy API] Auth error detected for ${connection.provider}, attempting token refresh and retry`
          );

          // Refresh the token
          const refreshedToken = await refreshAccessToken(supabase, connection, request.nextUrl.hostname);

          if (refreshedToken) {
            // Retry the request with the new token
            console.log(
              `[FreeBusy API] Token refreshed, retrying free/busy request for ${connection.provider}`
            );
            try {
              if (connection.provider === "google") {
                freeBusyResult = await fetchGoogleFreeBusy(
                  refreshedToken,
                  date,
                  timezone,
                  workStartTime,
                  workEndTime
                );
              } else if (connection.provider === "outlook") {
                freeBusyResult = await fetchOutlookFreeBusy(
                  refreshedToken,
                  date,
                  timezone,
                  workStartTime,
                  workEndTime
                );
              }
            } catch (retryError) {
              console.error(
                `[FreeBusy API] Retry failed after token refresh for ${connection.provider}:`,
                retryError
              );
              throw retryError;
            }
          } else {
            // Token refresh failed, return fallback
            console.error(
              `[FreeBusy API] Token refresh failed for ${connection.provider}, using fallback`
            );
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
              error: "CALENDAR_TOKEN_REFRESH_FAILED",
            });
          }
        } else {
          // Not an auth error, re-throw
          throw error;
        }
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

    if (!freeBusyResult) {
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
