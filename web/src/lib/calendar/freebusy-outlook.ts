import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

export type FreeBusySlot = {
  start: string; // ISO 8601
  end: string; // ISO 8601
};

export type FreeBusyResult = {
  freeMinutes: number;
  busySlots: FreeBusySlot[];
  workingHours: {
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
};

/**
 * Parse time string (HH:MM or HH:MM:SS) to hours and minutes
 */
function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1] || "0", 10);
  return { hours, minutes };
}

/**
 * Fetch free/busy data from Microsoft Outlook/Graph API for a specific date.
 * @param accessToken OAuth access token
 * @param date Date in YYYY-MM-DD format
 * @param timezone User's timezone (e.g., "America/New_York")
 * @param workStartTime Start time in HH:MM format (e.g., "09:30"), defaults to "09:00"
 * @param workEndTime End time in HH:MM format (e.g., "17:30"), defaults to "17:00"
 */
export async function fetchOutlookFreeBusy(
  accessToken: string,
  date: string,
  timezone: string = "UTC",
  workStartTime: string = "09:00",
  workEndTime: string = "17:00"
): Promise<FreeBusyResult> {
  // Create Graph client
  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  // Parse working hours
  const startTimeParsed = parseTimeString(workStartTime);
  const endTimeParsed = parseTimeString(workEndTime);

  // Parse date and set working hours (using user's custom hours)
  const dateObj = new Date(`${date}T00:00:00`);
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(startTimeParsed.hours, startTimeParsed.minutes, 0, 0);

  const endOfDay = new Date(dateObj);
  endOfDay.setHours(endTimeParsed.hours, endTimeParsed.minutes, 0, 0);

  // Convert to ISO strings for API
  const startTime = startOfDay.toISOString();
  const endTime = endOfDay.toISOString();

  // Fetch calendar events using getSchedule API
  let schedule;
  try {
    schedule = await client.api("/me/calendar/getSchedule").post({
      schedules: ["primary"],
      startTime: {
        dateTime: startTime,
        timeZone: timezone,
      },
      endTime: {
        dateTime: endTime,
        timeZone: timezone,
      },
      availabilityViewInterval: 15, // 15-minute intervals
    });
  } catch (error: unknown) {
    // Check if this is an authentication error (401/403)
    const errorObj = error as { statusCode?: number; code?: string };
    if (
      errorObj?.statusCode === 401 ||
      errorObj?.statusCode === 403 ||
      errorObj?.code === "InvalidAuthenticationToken"
    ) {
      const authError = new Error(
        "Calendar authentication failed - token may be expired"
      );
      (
        authError as { isAuthError?: boolean; originalError?: unknown }
      ).isAuthError = true;
      (
        authError as { isAuthError?: boolean; originalError?: unknown }
      ).originalError = error;
      throw authError;
    }
    // Re-throw other errors
    throw error;
  }

  const scheduleInfo = schedule.value?.[0];

  // Calculate total working minutes
  const startMinutes = startTimeParsed.hours * 60 + startTimeParsed.minutes;
  const endMinutes = endTimeParsed.hours * 60 + endTimeParsed.minutes;
  const totalMinutes = endMinutes - startMinutes;

  // Format times for response (HH:MM)
  const startTimeStr = `${startTimeParsed.hours
    .toString()
    .padStart(2, "0")}:${startTimeParsed.minutes.toString().padStart(2, "0")}`;
  const endTimeStr = `${endTimeParsed.hours
    .toString()
    .padStart(2, "0")}:${endTimeParsed.minutes.toString().padStart(2, "0")}`;

  if (!scheduleInfo || !scheduleInfo.scheduleItems) {
    return {
      freeMinutes: totalMinutes,
      busySlots: [],
      workingHours: { start: startTimeStr, end: endTimeStr },
    };
  }

  const busySlots: FreeBusySlot[] = [];
  for (const item of scheduleInfo.scheduleItems) {
    // Only include items that are busy (not free)
    if (item.status === "busy" || item.status === "tentative") {
      busySlots.push({
        start: item.start?.dateTime || "",
        end: item.end?.dateTime || "",
      });
    }
  }

  // Calculate free minutes
  let busyMinutes = 0;

  for (const slot of busySlots) {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes
    busyMinutes += duration;
  }

  const freeMinutes = Math.max(0, totalMinutes - busyMinutes);

  return {
    freeMinutes: Math.round(freeMinutes),
    busySlots,
    workingHours: { start: startTimeStr, end: endTimeStr },
  };
}
