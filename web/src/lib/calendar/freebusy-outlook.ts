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
 * Fetch free/busy data from Microsoft Outlook/Graph API for a specific date.
 * @param accessToken OAuth access token
 * @param date Date in YYYY-MM-DD format
 * @param timezone User's timezone (e.g., "America/New_York")
 * @param workStartHour Start hour (0-23), defaults to 9
 * @param workEndHour End hour (0-23), defaults to 17
 */
export async function fetchOutlookFreeBusy(
  accessToken: string,
  date: string,
  timezone: string = "UTC",
  workStartHour: number = 9,
  workEndHour: number = 17
): Promise<FreeBusyResult> {
  // Create Graph client
  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  // Parse date and set working hours (using user's custom hours)
  const dateObj = new Date(`${date}T00:00:00`);
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(workStartHour, 0, 0, 0);

  const endOfDay = new Date(dateObj);
  endOfDay.setHours(workEndHour, 0, 0, 0);

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
    const totalMinutes = (workEndHour - workStartHour) * 60;
    const startTimeStr = `${workStartHour.toString().padStart(2, "0")}:00`;
    const endTimeStr = `${workEndHour.toString().padStart(2, "0")}:00`;
    
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
    const totalMinutes = (workEndHour - workStartHour) * 60;
    const startTimeStr = `${workStartHour.toString().padStart(2, "0")}:00`;
    const endTimeStr = `${workEndHour.toString().padStart(2, "0")}:00`;
    return {
      freeMinutes: totalMinutes,
      busySlots: [],
      workingHours: { start: startTimeStr, end: endTimeStr },
    };
  }
}


