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
 */
function calculateCapacityFromFreeMinutes(freeMinutes: number | null): {
  level: "micro" | "light" | "standard" | "heavy" | "default";
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

