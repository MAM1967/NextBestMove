import type { CalendarConnection } from "./tokens";
import { fetchGoogleFreeBusy } from "./freebusy-google";
import { fetchOutlookFreeBusy } from "./freebusy-outlook";
import type { FreeBusySlot, FreeBusyResult } from "./freebusy-google";

/**
 * Merge overlapping or adjacent busy slots into a single slot.
 * Adjacent slots within 5 minutes are considered overlapping.
 */
export function mergeBusySlots(slots: FreeBusySlot[]): FreeBusySlot[] {
  if (slots.length === 0) return [];

  // Sort by start time
  const sorted = [...slots].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const merged: FreeBusySlot[] = [];
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    const currentEnd = new Date(current.end).getTime();
    const nextStart = new Date(next.start).getTime();

    // If overlapping or adjacent (within 5 minutes), merge
    if (nextStart <= currentEnd + 5 * 60 * 1000) {
      // Merge: extend current slot to end of next slot
      current = {
        start: current.start,
        end: new Date(
          Math.max(currentEnd, new Date(next.end).getTime())
        ).toISOString(),
      };
    } else {
      // No overlap, add current and move to next
      merged.push(current);
      current = next;
    }
  }

  // Add last slot
  merged.push(current);

  return merged;
}

/**
 * Calculate free minutes from working hours and busy slots.
 */
function calculateFreeMinutes(
  workStartTime: string,
  workEndTime: string,
  busySlots: FreeBusySlot[],
  date: string
): number {
  // Parse working hours
  const startParts = workStartTime.split(":");
  const endParts = workEndTime.split(":");
  const startHours = parseInt(startParts[0], 10);
  const startMinutes = parseInt(startParts[1] || "0", 10);
  const endHours = parseInt(endParts[0], 10);
  const endMinutes = parseInt(endParts[1] || "0", 10);

  // Create date objects for working hours
  const dateObj = new Date(`${date}T00:00:00`);
  const workStart = new Date(dateObj);
  workStart.setHours(startHours, startMinutes, 0, 0);
  const workEnd = new Date(dateObj);
  workEnd.setHours(endHours, endMinutes, 0, 0);

  const workStartMs = workStart.getTime();
  const workEndMs = workEnd.getTime();
  const totalWorkMinutes = (workEndMs - workStartMs) / (1000 * 60);

  // Calculate busy minutes
  let busyMinutes = 0;
  for (const slot of busySlots) {
    const slotStart = new Date(slot.start).getTime();
    const slotEnd = new Date(slot.end).getTime();

    // Only count overlap with working hours
    const overlapStart = Math.max(slotStart, workStartMs);
    const overlapEnd = Math.min(slotEnd, workEndMs);

    if (overlapStart < overlapEnd) {
      busyMinutes += (overlapEnd - overlapStart) / (1000 * 60);
    }
  }

  const freeMinutes = Math.max(0, totalWorkMinutes - busyMinutes);
  return Math.round(freeMinutes);
}

/**
 * Aggregate free/busy data from multiple calendar connections.
 * Handles partial failures gracefully - continues with available calendars.
 */
export async function aggregateFreeBusy(
  connections: CalendarConnection[],
  date: string,
  timezone: string,
  workStartTime: string,
  workEndTime: string,
  getValidAccessToken: (
    connection: CalendarConnection
  ) => Promise<string | null>
): Promise<{
  freeMinutes: number | null;
  busySlots: FreeBusySlot[];
  workingHours: { start: string; end: string };
  confidenceLabel: string;
  calendarCount: number;
  failedCalendars?: Array<{ calendarId: string; error: string }>;
}> {
  if (connections.length === 0) {
    return {
      freeMinutes: null,
      busySlots: [],
      workingHours: { start: workStartTime, end: workEndTime },
      confidenceLabel: "No calendars available",
      calendarCount: 0,
    };
  }

  // Fetch free/busy from all calendars in parallel
  const results = await Promise.allSettled(
    connections.map(async (connection) => {
      const accessToken = await getValidAccessToken(connection);
      if (!accessToken) {
        throw new Error("Unable to get access token");
      }

      if (connection.provider === "google") {
        return await fetchGoogleFreeBusy(
          accessToken,
          date,
          timezone,
          workStartTime,
          workEndTime
        );
      } else if (connection.provider === "outlook") {
        return await fetchOutlookFreeBusy(
          accessToken,
          date,
          timezone,
          workStartTime,
          workEndTime
        );
      } else {
        throw new Error(`Unsupported provider: ${connection.provider}`);
      }
    })
  );

  // Separate successful and failed results
  const successful: FreeBusyResult[] = [];
  const failed: Array<{ calendarId: string; error: string }> = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successful.push(result.value);
    } else {
      const connection = connections[index];
      failed.push({
        calendarId: connection.id,
        error: result.reason?.message || "Unknown error",
      });
      console.error(
        `Failed to fetch from calendar ${connection.id}:`,
        result.reason
      );
    }
  });

  // If all failed, return fallback
  if (successful.length === 0) {
    return {
      freeMinutes: null,
      busySlots: [],
      workingHours: { start: workStartTime, end: workEndTime },
      confidenceLabel: "No calendars available",
      calendarCount: 0,
      failedCalendars: failed,
    };
  }

  // Merge busy slots from all successful calendars
  const allBusySlots = successful.flatMap((result) => result.busySlots);
  const mergedBusySlots = mergeBusySlots(allBusySlots);

  // Calculate free minutes from merged slots
  const freeMinutes = calculateFreeMinutes(
    workStartTime,
    workEndTime,
    mergedBusySlots,
    date
  );

  // Generate confidence label
  const calendarCount = successful.length;
  const confidenceLabel =
    calendarCount === 1
      ? "Based on 1 calendar"
      : `Based on ${calendarCount} calendars`;

  return {
    freeMinutes,
    busySlots: mergedBusySlots,
    workingHours: { start: workStartTime, end: workEndTime },
    confidenceLabel,
    calendarCount,
    failedCalendars: failed.length > 0 ? failed : undefined,
  };
}





