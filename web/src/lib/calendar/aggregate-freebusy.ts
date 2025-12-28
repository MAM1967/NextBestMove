/**
 * Aggregate free/busy data across multiple calendar connections
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getActiveConnections, getValidAccessToken } from "./tokens";
import { fetchGoogleFreeBusy, type FreeBusyResult, type FreeBusySlot } from "./freebusy-google";
import { fetchOutlookFreeBusy } from "./freebusy-outlook";

export type AggregatedFreeBusyResult = FreeBusyResult & {
  calendarCount: number; // Number of calendars that contributed to this result
  confidence: "high" | "medium" | "low"; // Confidence based on number of calendars
};

/**
 * Merge multiple busy slot arrays, handling overlaps
 * When two calendars have overlapping busy slots, merge them into a single slot
 */
function mergeBusySlots(slotsArrays: FreeBusySlot[][]): FreeBusySlot[] {
  if (slotsArrays.length === 0) {
    return [];
  }

  // Flatten all slots into a single array
  const allSlots: Array<{ start: Date; end: Date }> = [];
  for (const slots of slotsArrays) {
    for (const slot of slots) {
      const start = new Date(slot.start);
      const end = new Date(slot.end);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start < end) {
        allSlots.push({ start, end });
      }
    }
  }

  if (allSlots.length === 0) {
    return [];
  }

  // Sort by start time
  allSlots.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Merge overlapping slots
  const merged: Array<{ start: Date; end: Date }> = [allSlots[0]];

  for (let i = 1; i < allSlots.length; i++) {
    const current = allSlots[i];
    const lastMerged = merged[merged.length - 1];

    // If current slot overlaps with or is adjacent to the last merged slot, merge them
    if (current.start <= lastMerged.end) {
      // Merge: extend the end time if current ends later
      lastMerged.end = new Date(Math.max(lastMerged.end.getTime(), current.end.getTime()));
    } else {
      // No overlap, add as new slot
      merged.push(current);
    }
  }

  // Convert back to ISO strings
  return merged.map((slot) => ({
    start: slot.start.toISOString(),
    end: slot.end.toISOString(),
  }));
}

/**
 * Calculate free minutes from merged busy slots and total working minutes
 */
function calculateFreeMinutesFromMergedSlots(
  mergedBusySlots: FreeBusySlot[],
  totalWorkingMinutes: number
): number {
  let busyMinutes = 0;
  for (const slot of mergedBusySlots) {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes
    busyMinutes += duration;
  }

  return Math.max(0, totalWorkingMinutes - busyMinutes);
}

/**
 * Determine confidence level based on number of calendars
 */
function getConfidenceLevel(calendarCount: number): "high" | "medium" | "low" {
  if (calendarCount >= 3) {
    return "high";
  } else if (calendarCount === 2) {
    return "medium";
  } else {
    return "low"; // 1 calendar or 0
  }
}

/**
 * Aggregate free/busy data across all active calendar connections for a user.
 * 
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param date - Date in YYYY-MM-DD format
 * @param timezone - User's timezone
 * @param workStartTime - Start time in HH:MM format
 * @param workEndTime - End time in HH:MM format
 * @returns Aggregated free/busy result with confidence level, or null if no connections
 */
export async function aggregateFreeBusyAcrossCalendars(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  timezone: string = "UTC",
  workStartTime: string = "09:00",
  workEndTime: string = "17:00"
): Promise<AggregatedFreeBusyResult | null> {
  // Get all active connections
  const connections = await getActiveConnections(supabase, userId);

  if (connections.length === 0) {
    return null;
  }

  // Fetch free/busy data for each connection
  const freeBusyResults: FreeBusyResult[] = [];
  const errors: Array<{ connectionId: string; error: Error }> = [];

  for (const connection of connections) {
    try {
      // Get valid access token
      const accessToken = await getValidAccessToken(supabase, connection);
      if (!accessToken) {
        console.warn(`Failed to get access token for connection ${connection.id}`);
        continue;
      }

      // Fetch free/busy data
      let result: FreeBusyResult;
      if (connection.provider === "google") {
        result = await fetchGoogleFreeBusy(
          accessToken,
          date,
          timezone,
          workStartTime,
          workEndTime
        );
      } else if (connection.provider === "outlook") {
        result = await fetchOutlookFreeBusy(
          accessToken,
          date,
          timezone,
          workStartTime,
          workEndTime
        );
      } else {
        console.warn(`Unknown provider: ${connection.provider}`);
        continue;
      }

      freeBusyResults.push(result);
    } catch (error) {
      console.error(`Error fetching free/busy for connection ${connection.id}:`, error);
      errors.push({
        connectionId: connection.id,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      // Continue with other connections even if one fails
    }
  }

  // If no successful results, return null
  if (freeBusyResults.length === 0) {
    return null;
  }

  // Use working hours from the first result (they should all be the same)
  const workingHours = freeBusyResults[0].workingHours;

  // Calculate total working minutes
  const startTimeParts = workStartTime.split(":");
  const endTimeParts = workEndTime.split(":");
  const startMinutes = parseInt(startTimeParts[0], 10) * 60 + parseInt(startTimeParts[1] || "0", 10);
  const endMinutes = parseInt(endTimeParts[0], 10) * 60 + parseInt(endTimeParts[1] || "0", 10);
  const totalWorkingMinutes = endMinutes - startMinutes;

  // Merge busy slots from all calendars
  const allBusySlots = freeBusyResults.map((result) => result.busySlots);
  const mergedBusySlots = mergeBusySlots(allBusySlots);

  // Calculate free minutes from merged slots
  const freeMinutes = calculateFreeMinutesFromMergedSlots(mergedBusySlots, totalWorkingMinutes);

  // Determine confidence level
  const calendarCount = freeBusyResults.length;
  const confidence = getConfidenceLevel(calendarCount);

  return {
    freeMinutes: Math.round(freeMinutes),
    busySlots: mergedBusySlots,
    workingHours,
    calendarCount,
    confidence,
  };
}

/**
 * Get confidence label for display (e.g., "based on 3 calendars")
 */
export function getConfidenceLabel(result: AggregatedFreeBusyResult): string {
  if (result.calendarCount === 1) {
    return "based on 1 calendar";
  } else {
    return `based on ${result.calendarCount} calendars`;
  }
}




