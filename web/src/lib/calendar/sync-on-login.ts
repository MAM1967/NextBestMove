import { createClient } from "@/lib/supabase/server";
import { getActiveConnection, getValidAccessToken } from "./tokens";
import { fetchGoogleFreeBusy } from "./freebusy-google";
import { fetchOutlookFreeBusy } from "./freebusy-outlook";
import { invalidateCache, setCachedFreeBusy } from "./cache";

/**
 * Trigger a calendar sync on login/page load.
 * This runs in the background and doesn't block page rendering.
 * 
 * Strategy:
 * - Invalidates cache for today and next 7 days
 * - Fetches fresh free/busy data for today (which will cache for other days)
 * - Updates last_sync_at timestamp
 * 
 * This ensures calendar data is fresh when users log in.
 */
export async function syncCalendarOnLogin(userId: string): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Check if user has an active calendar connection
    const connection = await getActiveConnection(supabase, userId);
    if (!connection) {
      // No calendar connected, nothing to sync
      return;
    }

    // Invalidate cache for today and next 7 days
    // This forces fresh data to be fetched on next capacity check
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }

    // Invalidate cache for all dates
    for (const date of dates) {
      invalidateCache(userId, date);
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase, connection);
    if (!accessToken) {
      return;
    }

    // Get user timezone
    const { data: userProfile } = await supabase
      .from("users")
      .select("timezone")
      .eq("id", userId)
      .single();

    const timezone = userProfile?.timezone || "UTC";

    // Fetch free/busy for today to refresh cache and update last_sync_at
    const todayStr = dates[0];
    try {
      let freeBusyResult;
      if (connection.provider === "google") {
        freeBusyResult = await fetchGoogleFreeBusy(accessToken, todayStr, timezone);
      } else if (connection.provider === "outlook") {
        freeBusyResult = await fetchOutlookFreeBusy(accessToken, todayStr, timezone);
      } else {
        return;
      }

      // Calculate capacity
      const freeMinutes = freeBusyResult.freeMinutes;
      let capacity: "micro" | "light" | "standard" | "heavy" | "default";
      let suggestedActionCount: number;

      if (freeMinutes === null || freeMinutes < 30) {
        capacity = "micro";
        suggestedActionCount = 1;
      } else if (freeMinutes < 60) {
        capacity = "light";
        suggestedActionCount = 3;
      } else if (freeMinutes < 120) {
        capacity = "standard";
        suggestedActionCount = 6;
      } else {
        capacity = "heavy";
        suggestedActionCount = 8;
      }

      // Cache the result
      setCachedFreeBusy(userId, todayStr, {
        freeMinutes: freeBusyResult.freeMinutes,
        busySlots: freeBusyResult.busySlots,
        capacity,
        suggestedActionCount,
      });

      // Update last_sync_at
      await supabase
        .from("calendar_connections")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", connection.id);

      console.log("Calendar sync on login: Success");
    } catch (error) {
      // Silently fail - don't block user experience
      console.warn("Calendar sync on login: Error fetching free/busy", error);
    }

  } catch (error) {
    // Silently fail - don't block user experience
    console.warn("Calendar sync on login: Error", error);
  }
}

