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
    const todayStr = now.toLocaleDateString("en-CA", { timeZone: timezone }); // YYYY-MM-DD
    const [year, month, day] = todayStr.split("-").map(Number);
    
    // Create start date (today at 00:00:00 in user's timezone, converted to UTC)
    const todayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    // Create end date (today + days at 23:59:59 in user's timezone, converted to UTC)
    const endDate = new Date(Date.UTC(year, month - 1, day + days, 0, 0, 0, 0));

    let events: CalendarEvent[] = [];

    if (connection.provider === "google") {
      events = await fetchGoogleEvents(accessToken, todayStart, endDate, timezone);
    } else if (connection.provider === "outlook") {
      events = await fetchOutlookEvents(accessToken, todayStart, endDate, timezone);
    }

    // Group events by date and calculate availability
    const daysData: DayAvailability[] = [];
    for (let i = 0; i < days; i++) {
      // Calculate date in user's timezone
      const dateInTz = new Date(year, month - 1, day + i);
      const dayOfWeek = dateInTz.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      if (isWeekend && excludeWeekends) {
        // Skip weekends if user has excluded them
        continue;
      }

      // Create date string (YYYY-MM-DD) for this day
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day + i).padStart(2, "0")}`;

      // Calculate day boundaries in user's timezone (9 AM - 5 PM)
      const dayStartLocal = new Date(year, month - 1, day + i, 9, 0, 0, 0);
      const dayEndLocal = new Date(year, month - 1, day + i, 17, 0, 0, 0);
      
      // Convert to UTC for comparison with event times
      // Get timezone offset for this date
      const tzOffset = dayStartLocal.getTimezoneOffset() * 60000; // offset in milliseconds
      const dayStartUTC = new Date(dayStartLocal.getTime() - tzOffset);
      const dayEndUTC = new Date(dayEndLocal.getTime() - tzOffset);
      
      const dayStartISO = dayStartUTC.toISOString();
      const dayEndISO = dayEndUTC.toISOString();

      // Filter events that overlap with this day's working hours
      const dayEvents = events.filter((event) => {
        // Events come as ISO strings, compare directly
        return (
          (event.start >= dayStartISO && event.start < dayEndISO) ||
          (event.end > dayStartISO && event.end <= dayEndISO) ||
          (event.start < dayStartISO && event.end > dayEndISO)
        );
      });

      // Calculate busy minutes (only within 9 AM - 5 PM)
      let busyMinutes = 0;
      for (const event of dayEvents) {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        const workStart = new Date(Math.max(eventStart.getTime(), dayStartUTC.getTime()));
        const workEnd = new Date(Math.min(eventEnd.getTime(), dayEndUTC.getTime()));
        if (workStart < workEnd) {
          busyMinutes += (workEnd.getTime() - workStart.getTime()) / (1000 * 60);
        }
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
