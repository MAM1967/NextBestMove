import type { SupabaseClient } from "@supabase/supabase-js";
import { getCachedFreeBusy } from "./cache";
import {
  getActiveConnection,
  getValidAccessToken,
  refreshAccessToken,
} from "./tokens";
import { fetchGoogleFreeBusy } from "./freebusy-google";
import { fetchOutlookFreeBusy } from "./freebusy-outlook";

export type CapacityInfo = {
  level: "micro" | "light" | "standard" | "heavy" | "default";
  actionsPerDay: number;
  source: "fallback" | "calendar";
};

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
function calculateCapacityFromFreeMinutes(freeMinutes: number | null): {
  level: "micro" | "light" | "standard" | "heavy" | "default";
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
 * Get capacity for a specific date.
 * Uses cached data if available, otherwise fetches from calendar.
 */
export async function getCapacityForDate(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<CapacityInfo> {
  // Check cache first
  const cached = getCachedFreeBusy(userId, date);
  if (cached) {
    return {
      level: cached.capacity,
      actionsPerDay: cached.suggestedActionCount,
      source: "calendar",
    };
  }

  // Get active connection
  const connection = await getActiveConnection(supabase, userId);
  if (!connection) {
    return {
      level: "default",
      actionsPerDay: 6,
      source: "fallback",
    };
  }

  // Get valid access token
  const accessToken = await getValidAccessToken(supabase, connection);
  if (!accessToken) {
    return {
      level: "default",
      actionsPerDay: 6,
      source: "fallback",
    };
  }

  // Get user timezone and working hours
  const { data: userProfile } = await supabase
    .from("users")
    .select("timezone, work_start_time, work_end_time")
    .eq("id", userId)
    .single();

  const timezone = userProfile?.timezone || "UTC";
  // Convert TIME to HH:MM string (PostgreSQL TIME format is HH:MM:SS)
  const workStartTime = userProfile?.work_start_time
    ? userProfile.work_start_time.substring(0, 5) // Extract HH:MM from HH:MM:SS
    : "09:00";
  const workEndTime = userProfile?.work_end_time
    ? userProfile.work_end_time.substring(0, 5) // Extract HH:MM from HH:MM:SS
    : "17:00";

  // Fetch free/busy data with retry logic for 401 errors
  try {
    let freeBusyResult;
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
        return {
          level: "default",
          actionsPerDay: 6,
          source: "fallback",
        };
      }
    } catch (error: unknown) {
      // If we get an auth error (401/403), try refreshing the token and retrying once
      const errorObj = error as { isAuthError?: boolean };
      if (errorObj?.isAuthError) {
        console.log(
          `[Capacity] Auth error detected for ${connection.provider}, attempting token refresh and retry`
        );

        // Refresh the token
        const refreshedToken = await refreshAccessToken(supabase, connection);

        if (refreshedToken) {
          // Retry the request with the new token
          console.log(
            `[Capacity] Token refreshed, retrying free/busy request for ${connection.provider}`
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
              `[Capacity] Retry failed after token refresh for ${connection.provider}:`,
              retryError
            );
            throw retryError;
          }
        } else {
          // Token refresh failed, return fallback
          console.error(
            `[Capacity] Token refresh failed for ${connection.provider}, using fallback`
          );
          return {
            level: "default",
            actionsPerDay: 6,
            source: "fallback",
          };
        }
      } else {
        // Not an auth error, re-throw
        throw error;
      }
    }

    if (!freeBusyResult) {
      return {
        level: "default",
        actionsPerDay: 6,
        source: "fallback",
      };
    }

    const { level, suggestedActionCount } = calculateCapacityFromFreeMinutes(
      freeBusyResult.freeMinutes
    );

    return {
      level,
      actionsPerDay: suggestedActionCount,
      source: "calendar",
    };
  } catch (error) {
    console.error("Failed to fetch free/busy:", error);
    return {
      level: "default",
      actionsPerDay: 6,
      source: "fallback",
    };
  }
}
