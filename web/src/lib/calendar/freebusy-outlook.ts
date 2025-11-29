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
  const startTime = parseTimeString(workStartTime);
  const endTime = parseTimeString(workEndTime);

  // Parse date and set working hours (using user's custom hours)
  const dateObj = new Date(`${date}T00:00:00`);
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(startTime.hours, startTime.minutes, 0, 0);

  const endOfDay = new Date(dateObj);
  endOfDay.setHours(endTime.hours, endTime.minutes, 0, 0);

  // Convert to ISO strings for API
  const startTime = startOfDay.toISOString();
  const endTime = endOfDay.toISOString();

  // Fetch calendar events using getSchedule API
  try {
    const schedule = await client
      .api("/me/calendar/getSchedule")
      .post({
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

    const scheduleInfo = schedule.value?.[0];
    
    // Calculate total working minutes
    const startMinutes = startTime.hours * 60 + startTime.minutes;
    const endMinutes = endTime.hours * 60 + endTime.minutes;
    const totalMinutes = endMinutes - startMinutes;
    
    // Format times for response (HH:MM)
    const startTimeStr = `${startTime.hours.toString().padStart(2, "0")}:${startTime.minutes.toString().padStart(2, "0")}`;
    const endTimeStr = `${endTime.hours.toString().padStart(2, "0")}:${endTime.minutes.toString().padStart(2, "0")}`;
    
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
  } catch (error) {
    console.error("Failed to fetch Outlook free/busy:", error);
    // Return default (all free) on error
    const startMinutes = startTime.hours * 60 + startTime.minutes;
    const endMinutes = endTime.hours * 60 + endTime.minutes;
    const totalMinutes = endMinutes - startMinutes;
    const startTimeStr = `${startTime.hours.toString().padStart(2, "0")}:${startTime.minutes.toString().padStart(2, "0")}`;
    const endTimeStr = `${endTime.hours.toString().padStart(2, "0")}:${endTime.minutes.toString().padStart(2, "0")}`;
    return {
      freeMinutes: totalMinutes,
      busySlots: [],
      workingHours: { start: startTimeStr, end: endTimeStr },
    };
  }
}


