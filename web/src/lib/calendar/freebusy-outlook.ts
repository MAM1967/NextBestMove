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
 */
export async function fetchOutlookFreeBusy(
  accessToken: string,
  date: string,
  timezone: string = "UTC"
): Promise<FreeBusyResult> {
  // Create Graph client
  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  // Parse date and set working hours (9 AM - 5 PM in user's timezone)
  const dateObj = new Date(`${date}T00:00:00`);
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(9, 0, 0, 0); // 9 AM

  const endOfDay = new Date(dateObj);
  endOfDay.setHours(17, 0, 0, 0); // 5 PM

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
    if (!scheduleInfo || !scheduleInfo.scheduleItems) {
      return {
        freeMinutes: 480, // 8 hours (9 AM - 5 PM)
        busySlots: [],
        workingHours: { start: "09:00", end: "17:00" },
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
    const totalMinutes = 480; // 8 hours * 60 minutes
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
      workingHours: { start: "09:00", end: "17:00" },
    };
  } catch (error) {
    console.error("Failed to fetch Outlook free/busy:", error);
    // Return default (all free) on error
    return {
      freeMinutes: 480,
      busySlots: [],
      workingHours: { start: "09:00", end: "17:00" },
    };
  }
}

