import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveConnection, getValidAccessToken } from "@/lib/calendar/tokens";
import { google } from "googleapis";
import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO 8601 for timed, YYYY-MM-DD for all-day
  end: string; // ISO 8601 for timed, YYYY-MM-DD for all-day (exclusive for all-day)
  duration: number; // minutes
  isAllDay: boolean; // true if all-day event
};

type DayAvailability = {
  date: string; // YYYY-MM-DD
  events: CalendarEvent[];
  totalBusyMinutes: number;
  availableMinutes: number;
  capacity: "micro" | "light" | "standard" | "heavy" | "default";
  suggestedActionCount: number;
};

/**
 * Get date string (YYYY-MM-DD) for a date in a specific timezone
 */
function getDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date); // Returns "YYYY-MM-DD"
}

/**
 * Add days to a date, return date string in user's timezone
 */
function addDaysInTimezone(baseDate: Date, days: number, timezone: string): string {
  // Add days in milliseconds (simple, avoids timezone issues)
  const newDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
  return getDateInTimezone(newDate, timezone);
}

/**
 * Add days to a date string (YYYY-MM-DD), return new date string
 * This avoids timezone conversion issues by working directly with date strings
 */
function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Create date at noon UTC to avoid DST issues
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  date.setUTCDate(date.getUTCDate() + days);
  // Format back to YYYY-MM-DD using UTC methods to avoid timezone conversion
  const yearStr = date.getUTCFullYear();
  const monthStr = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dayStr = String(date.getUTCDate()).padStart(2, "0");
  return `${yearStr}-${monthStr}-${dayStr}`;
}

/**
 * Check if a date is a weekend in the user's timezone
 */
function isWeekend(dateStr: string, timezone: string): boolean {
  // Create date at noon UTC to avoid DST issues
  const date = new Date(dateStr + "T12:00:00Z");

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short", // 'Sun', 'Mon', etc.
  });

  const dayName = formatter.format(date);
  return dayName === "Sat" || dayName === "Sun";
}

/**
 * Get all dates an event falls on (handles multi-day all-day events)
 */
function getEventDates(event: CalendarEvent, timezone: string): string[] {
  if (event.isAllDay) {
    // All-day event - may span multiple days
    const dates: string[] = [];
    const start = new Date(event.start + "T00:00:00");
    const end = new Date(event.end + "T00:00:00"); // end is exclusive

    // Generate all dates from start (inclusive) to end (exclusive)
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      dates.push(getDateInTimezone(d, timezone));
    }
    return dates;
  } else {
    // Timed event - typically just one date
    const date = new Date(event.start);
    return [getDateInTimezone(date, timezone)];
  }
}

/**
 * Calculate busy minutes for an event within working hours (9 AM - 5 PM) in user's timezone
 */
function getBusyMinutes(event: CalendarEvent, dateStr: string, timezone: string): number {
  if (event.isAllDay) {
    // All-day event - count as full working day
    return 480; // 8 hours * 60 minutes
  }

  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);

  // Get event times in the user's timezone as formatted strings
  const startParts = eventStart.toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).split(":");
  const endParts = eventEnd.toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).split(":");

  const startHour = parseInt(startParts[0] || "0", 10);
  const startMin = parseInt(startParts[1] || "0", 10);
  const endHour = parseInt(endParts[0] || "0", 10);
  const endMin = parseInt(endParts[1] || "0", 10);

  // Working hours: 9:00 AM (540 minutes) to 5:00 PM (1020 minutes)
  const workStartMin = 9 * 60; // 540 minutes
  const workEndMin = 17 * 60; // 1020 minutes

  const eventStartMin = startHour * 60 + startMin;
  const eventEndMin = endHour * 60 + endMin;

  // Calculate overlap
  const overlapStart = Math.max(eventStartMin, workStartMin);
  const overlapEnd = Math.min(eventEndMin, workEndMin);

  if (overlapStart >= overlapEnd) {
    return 0;
  }

  return overlapEnd - overlapStart;
}

/**
 * GET /api/calendar/events?days=7
 *
 * Returns calendar events for the next N days (default 7) with availability breakdown.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get number of days from query params (default 7)
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const days = daysParam ? parseInt(daysParam, 10) : 7;

    // Get active calendar connection
    const connection = await getActiveConnection(supabase, user.id);
    if (!connection) {
      return NextResponse.json({
        connected: false,
        message: "Calendar not connected",
        days: [],
      });
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase, connection);
    if (!accessToken) {
      return NextResponse.json({
        connected: true,
        message: "Unable to access calendar",
        days: [],
      });
    }

    // Get user timezone and weekend preference
    const { data: userProfile } = await supabase
      .from("users")
      .select("timezone, exclude_weekends")
      .eq("id", user.id)
      .single();

    const timezone = userProfile?.timezone || "UTC";
    const excludeWeekends = userProfile?.exclude_weekends ?? false;

    // Calculate today in user's timezone
    // CRITICAL: Get the current moment, then format it in user's timezone
    const now = new Date();
    const todayStr = getDateInTimezone(now, timezone);
    
    // DEBUG: Log to verify today calculation
    console.log("Calendar Events Debug:", {
      serverTime: now.toISOString(),
      userTimezone: timezone,
      todayInUserTz: todayStr,
      excludeWeekends,
    });
    
    // For API calls, we need to create Date objects that represent the correct time range
    // in the user's timezone. The Google/Outlook APIs accept ISO strings and timezone parameters.
    // We'll create dates representing the start/end of the range in the user's timezone.
    
    // Get current date/time components in user's timezone
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    
    const todayParts = formatter.formatToParts(now);
    const year = todayParts.find(p => p.type === "year")?.value;
    const month = todayParts.find(p => p.type === "month")?.value;
    const day = todayParts.find(p => p.type === "day")?.value;
    
    // Create start date: today at 00:00:00 in user's timezone
    // We'll create an ISO string, but the API will interpret it with the timezone parameter
    const startDateStr = `${year}-${month}-${day}T00:00:00`;
    const startDate = new Date(startDateStr);
    
    // For end date, calculate the last day we need (today + days + 2 buffer for weekends)
    const endDateStr = addDaysInTimezone(now, days + 2, timezone);
    const endDate = new Date(`${endDateStr}T23:59:59`);

    let events: CalendarEvent[] = [];

    if (connection.provider === "google") {
      events = await fetchGoogleEvents(accessToken, startDate, endDate, timezone);
    } else if (connection.provider === "outlook") {
      events = await fetchOutlookEvents(accessToken, startDate, endDate, timezone);
    }

    // Group events by date and calculate availability
    const daysData: DayAvailability[] = [];
    let daysAdded = 0;
    let dayOffset = 0;

    while (daysAdded < days) {
      // Calculate date string for this day in user's timezone
      // CRITICAL: Start from todayStr (already in user's timezone) and add dayOffset days
      // Use addDaysToDateString to work directly with date strings and avoid timezone issues
      const dateStr = addDaysToDateString(todayStr, dayOffset);

      // Check if this is a weekend and user excludes weekends
      if (excludeWeekends && isWeekend(dateStr, timezone)) {
        // Skip weekends if user has excluded them, but continue to next day
        dayOffset++;
        continue;
      }

      // Filter events for this day (handles multi-day all-day events)
      const dayEvents = events.filter((event) => {
        const eventDates = getEventDates(event, timezone);
        return eventDates.includes(dateStr);
      });

      // Calculate busy minutes (only within 9 AM - 5 PM)
      let busyMinutes = 0;
      for (const event of dayEvents) {
        busyMinutes += getBusyMinutes(event, dateStr, timezone);
      }

      const totalWorkingMinutes = 480; // 8 hours * 60 minutes
      const availableMinutes = Math.max(0, totalWorkingMinutes - busyMinutes);

      // Calculate capacity based on ~30 minutes per action
      let capacity: "micro" | "light" | "standard" | "heavy" | "default";
      let suggestedActionCount: number;

      if (availableMinutes < 1) {
        capacity = "micro";
        suggestedActionCount = 0; // Fully booked
      } else {
        const actions = Math.floor(availableMinutes / 30);
        const actionCount = Math.min(actions, 8);

        if (actionCount === 0) {
          capacity = "micro";
          suggestedActionCount = 0;
        } else if (actionCount <= 1) {
          capacity = "micro";
          suggestedActionCount = 1;
        } else if (actionCount <= 2) {
          capacity = "light";
          suggestedActionCount = 2;
        } else if (actionCount <= 3) {
          capacity = "light";
          suggestedActionCount = 3;
        } else if (actionCount <= 4) {
          capacity = "standard";
          suggestedActionCount = 4;
        } else if (actionCount <= 6) {
          capacity = "standard";
          suggestedActionCount = 6;
        } else {
          capacity = "heavy";
          suggestedActionCount = 8;
        }
      }

      daysData.push({
        date: dateStr,
        events: dayEvents,
        totalBusyMinutes: Math.round(busyMinutes),
        availableMinutes: Math.round(availableMinutes),
        capacity,
        suggestedActionCount,
      });

      daysAdded++;
      dayOffset++;
    }

    return NextResponse.json({
      connected: true,
      provider: connection.provider,
      timezone,
      days: daysData,
    });
  } catch (error: any) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch calendar events",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch events from Google Calendar
 */
async function fetchGoogleEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date,
  timezone: string
): Promise<CalendarEvent[]> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    timeZone: timezone,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 2500, // Google's max
  });

  const events: CalendarEvent[] = [];
  for (const item of response.data.items || []) {
    if (!item.start || !item.end) continue;

    const isAllDay = !item.start.dateTime; // If dateTime is missing, it's all-day

    if (isAllDay) {
      // All-day event - use date fields directly
      const startDate = item.start.date;
      const endDate = item.end.date;
      if (!startDate || !endDate) continue;

      // Calculate duration in days
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(endDate + "T00:00:00");
      const durationDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

      events.push({
        id: item.id || "",
        title: item.summary || "No title",
        start: startDate, // Use start.date directly
        end: endDate, // Keep end.date for multi-day handling
        duration: durationDays * 24 * 60, // Convert days to minutes
        isAllDay: true,
      });
    } else {
      // Timed event - use dateTime fields
      const start = item.start.dateTime;
      const end = item.end.dateTime;
      if (!start || !end) continue;

      const startDate = new Date(start);
      const endDate = new Date(end);
      const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

      events.push({
        id: item.id || "",
        title: item.summary || "No title",
        start,
        end,
        duration: Math.round(duration),
        isAllDay: false,
      });
    }
  }

  return events;
}

/**
 * Fetch events from Microsoft Outlook/Graph API
 */
async function fetchOutlookEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date,
  timezone: string
): Promise<CalendarEvent[]> {
  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  const response = await client
    .api("/me/calendar/calendarView")
    .query({
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
    })
    .header("Prefer", `outlook.timezone="${timezone}"`)
    .get();

  const events: CalendarEvent[] = [];
  for (const item of response.value || []) {
    if (!item.start || !item.end) continue;

    const start = item.start.dateTime;
    const end = item.end.dateTime;
    if (!start || !end) continue;

    const isAllDay = item.isAllDay || false;

    if (isAllDay) {
      // All-day event - extract date from dateTime
      const startDate = new Date(start);
      const endDate = new Date(end);
      const startDateStr = getDateInTimezone(startDate, timezone);
      const endDateStr = getDateInTimezone(endDate, timezone);

      // Calculate duration in days
      const durationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

      events.push({
        id: item.id || "",
        title: item.subject || "No title",
        start: startDateStr,
        end: endDateStr,
        duration: durationDays * 24 * 60, // Convert days to minutes
        isAllDay: true,
      });
    } else {
      // Timed event
      const startDate = new Date(start);
      const endDate = new Date(end);
      const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

      events.push({
        id: item.id || "",
        title: item.subject || "No title",
        start,
        end,
        duration: Math.round(duration),
        isAllDay: false,
      });
    }
  }

  return events;
}
