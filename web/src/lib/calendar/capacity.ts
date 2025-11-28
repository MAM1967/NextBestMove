import type { SupabaseClient } from "@supabase/supabase-js";
import { getCachedFreeBusy } from "./cache";
import { getActiveConnection, getValidAccessToken } from "./tokens";
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

  // Get user timezone
  const { data: userProfile } = await supabase
    .from("users")
    .select("timezone")
    .eq("id", userId)
    .single();

  const timezone = userProfile?.timezone || "UTC";

  // Fetch free/busy data
  try {
    let freeBusyResult;
    if (connection.provider === "google") {
      freeBusyResult = await fetchGoogleFreeBusy(accessToken, date, timezone);
    } else if (connection.provider === "outlook") {
      freeBusyResult = await fetchOutlookFreeBusy(accessToken, date, timezone);
    } else {
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
