import { google } from "googleapis";

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
 * Fetch free/busy data from Google Calendar for a specific date.
 * @param accessToken OAuth access token
 * @param date Date in YYYY-MM-DD format
 * @param timezone User's timezone (e.g., "America/New_York")
 */
export async function fetchGoogleFreeBusy(
  accessToken: string,
  date: string,
  timezone: string = "UTC"
): Promise<FreeBusyResult> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Parse date and set working hours (9 AM - 5 PM in user's timezone)
  const dateObj = new Date(`${date}T00:00:00`);
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(9, 0, 0, 0); // 9 AM

  const endOfDay = new Date(dateObj);
  endOfDay.setHours(17, 0, 0, 0); // 5 PM

  // Convert to ISO strings for API
  const timeMin = startOfDay.toISOString();
  const timeMax = endOfDay.toISOString();

  // Fetch free/busy data
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: timezone,
      items: [{ id: "primary" }],
    },
  });

  const calendars = response.data.calendars;
  if (!calendars || !calendars.primary) {
    return {
      freeMinutes: 480, // 8 hours (9 AM - 5 PM)
      busySlots: [],
      workingHours: { start: "09:00", end: "17:00" },
    };
  }

  const busy = calendars.primary.busy || [];
  const busySlots: FreeBusySlot[] = busy.map((slot) => ({
    start: slot.start || "",
    end: slot.end || "",
  }));

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
}

