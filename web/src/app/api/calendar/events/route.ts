import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveConnection, getValidAccessToken } from "@/lib/calendar/tokens";
import { google } from "googleapis";
import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  duration: number; // minutes
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
  return date.toLocaleDateString("en-CA", { timeZone: timezone });
}

/**
 * Get the date (YYYY-MM-DD) that an event falls on in a specific timezone
 */
function getEventDate(eventStart: string, timezone: string): string {
  const date = new Date(eventStart);
  return getDateInTimezone(date, timezone);
}

/**
 * Calculate busy minutes for an event within working hours (9 AM - 5 PM) in user's timezone
 */
function getBusyMinutes(event: CalendarEvent, dateStr: string, timezone: string): number {
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
    const now = new Date();
    const todayStr = getDateInTimezone(now, timezone);
    
    // Parse today's date components in user's timezone
    const [year, month, day] = todayStr.split("-").map(Number);
    
    // Create start and end dates for fetching events (in UTC, but representing the date range in user's timezone)
    // We need to fetch events that might fall on any of the days we're interested in
    // So we fetch from start of today to end of (today + days) in user's timezone
    const startDate = new Date(`${todayStr}T00:00:00`);
    // Adjust for timezone offset to get the correct UTC time
    const tzOffset = new Date().getTimezoneOffset() * 60000; // offset in milliseconds
    const startDateUTC = new Date(startDate.getTime() - tzOffset);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    endDate.setHours(23, 59, 59, 999);
    const endDateUTC = new Date(endDate.getTime() - tzOffset);

    let events: CalendarEvent[] = [];

    if (connection.provider === "google") {
      events = await fetchGoogleEvents(accessToken, startDateUTC, endDateUTC, timezone);
    } else if (connection.provider === "outlook") {
      events = await fetchOutlookEvents(accessToken, startDateUTC, endDateUTC, timezone);
    }

    // Group events by date and calculate availability
    const daysData: DayAvailability[] = [];
    let daysAdded = 0;
    let dayOffset = 0;
    
    while (daysAdded < days) {
      // Calculate date string for this day in user's timezone
      // Start from today and add dayOffset days
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const dateStr = getDateInTimezone(targetDate, timezone);
      
      // Get day of week - we need to check what day of week this date is in the user's timezone
      // Create a date at noon in the user's timezone to avoid DST issues
      const dateAtNoon = new Date(`${dateStr}T12:00:00`);
      // Format to get the day of week in the user's timezone
      const dayOfWeekStr = dateAtNoon.toLocaleDateString("en-US", {
        timeZone: timezone,
        weekday: "long",
      });
      // Convert to number (0 = Sunday, 6 = Saturday)
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayOfWeek = dayNames.indexOf(dayOfWeekStr);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      if (isWeekend && excludeWeekends) {
        // Skip weekends if user has excluded them, but continue to next day
        dayOffset++;
        continue;
      }

      // Filter events for this day (any event that falls on this date in user's timezone)
      const dayEvents = events.filter((event) => {
        const eventDate = getEventDate(event.start, timezone);
        return eventDate === dateStr;
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

    const start = item.start.dateTime || item.start.date;
    const end = item.end.dateTime || item.end.date;
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
    });
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

    const startDate = new Date(start);
    const endDate = new Date(end);
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

    events.push({
      id: item.id || "",
      title: item.subject || "No title",
      start,
      end,
      duration: Math.round(duration),
    });
  }

  return events;
}
