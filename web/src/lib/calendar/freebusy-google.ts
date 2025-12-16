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
 * Parse time string (HH:MM or HH:MM:SS) to hours and minutes
 */
function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1] || "0", 10);
  return { hours, minutes };
}

/**
 * Fetch free/busy data from Google Calendar for a specific date.
 * @param accessToken OAuth access token
 * @param date Date in YYYY-MM-DD format
 * @param timezone User's timezone (e.g., "America/New_York")
 * @param workStartTime Start time in HH:MM format (e.g., "09:30"), defaults to "09:00"
 * @param workEndTime End time in HH:MM format (e.g., "17:30"), defaults to "17:00"
 */
export async function fetchGoogleFreeBusy(
  accessToken: string,
  date: string,
  timezone: string = "UTC",
  workStartTime: string = "09:00",
  workEndTime: string = "17:00"
): Promise<FreeBusyResult> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

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
  const timeMin = startOfDay.toISOString();
  const timeMax = endOfDay.toISOString();

  // Fetch free/busy data
  // Note: We don't handle 401 errors here - that's handled at a higher level
  // The calendar API client will throw an error if the token is invalid
  let response;
  try {
    response = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        timeZone: timezone,
        items: [{ id: "primary" }],
      },
    });
  } catch (error: unknown) {
    // Check if this is an authentication error (401/403)
    const errorObj = error as { code?: number; status?: number };
    if (
      errorObj?.code === 401 ||
      errorObj?.code === 403 ||
      errorObj?.status === 401 ||
      errorObj?.status === 403
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

  const calendars = response.data.calendars;

  // Calculate total working minutes
  const startMinutes = startTime.hours * 60 + startTime.minutes;
  const endMinutes = endTime.hours * 60 + endTime.minutes;
  const totalMinutes = endMinutes - startMinutes;

  // Format times for response (HH:MM)
  const startTimeStr = `${startTime.hours
    .toString()
    .padStart(2, "0")}:${startTime.minutes.toString().padStart(2, "0")}`;
  const endTimeStr = `${endTime.hours
    .toString()
    .padStart(2, "0")}:${endTime.minutes.toString().padStart(2, "0")}`;

  if (!calendars || !calendars.primary) {
    return {
      freeMinutes: totalMinutes,
      busySlots: [],
      workingHours: { start: startTimeStr, end: endTimeStr },
    };
  }

  const busy = calendars.primary.busy || [];
  const busySlots: FreeBusySlot[] = busy.map((slot) => ({
    start: slot.start || "",
    end: slot.end || "",
  }));

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
