import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveConnections, getValidAccessToken } from "@/lib/calendar/tokens";
import { isLikelyCall, matchEventToLead } from "@/lib/pre-call-briefs/calendar-detection";
import type { CalendarEvent } from "@/lib/pre-call-briefs/types";
import { google } from "googleapis";
import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

/**
 * GET /api/cron/create-call-prep-actions
 * 
 * Cron job to automatically create CALL_PREP actions 24 hours before detected calls.
 * Runs hourly with timezone filtering to process users where local time is 9 AM.
 * 
 * This endpoint is called by cron-job.org and requires authentication via
 * the Authorization header with a secret token.
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET?.trim().replace(/\r?\n/g, "");
    const cronJobOrgApiKey = process.env.CRON_JOB_ORG_API_KEY?.trim().replace(/\r?\n/g, "");

    const isAuthorized =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronJobOrgApiKey && authHeader === `Bearer ${cronJobOrgApiKey}`) ||
      (cronSecret && querySecret === cronSecret);

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Get all users with active calendar connections
    const { data: connections, error: connectionsError } = await adminClient
      .from("calendar_connections")
      .select("user_id, provider, calendar_id, status")
      .eq("status", "active");

    if (connectionsError) {
      console.error("[Cron CALL_PREP] Error fetching calendar connections:", connectionsError);
      return NextResponse.json(
        { error: "Failed to fetch calendar connections", details: connectionsError.message },
        { status: 500 }
      );
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active calendar connections found",
        processed: 0,
        created: 0,
      });
    }

    // Get unique user IDs
    const userIds = [...new Set(connections.map((c) => c.user_id))];

    // Get user timezones and working hours
    const { data: users, error: usersError } = await adminClient
      .from("users")
      .select("id, timezone, work_start_time, work_end_time")
      .in("id", userIds);

    if (usersError) {
      console.error("[Cron CALL_PREP] Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users", details: usersError.message },
        { status: 500 }
      );
    }

    const userMap = new Map(users?.map((u) => [u.id, u]) || []);

    let processedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    // Process each user
    for (const userId of userIds) {
      try {
        const user = userMap.get(userId);
        if (!user) {
          skippedCount++;
          continue;
        }

        // Timezone-aware filtering: only process users where local time is 9 AM
        const userTimezone = user.timezone || "UTC";
        const now = new Date();
        const userLocalTime = new Date(
          now.toLocaleString("en-US", { timeZone: userTimezone })
        );
        const userLocalHour = userLocalTime.getHours();

        // Only process users where local time is 9 AM (within 1 hour window)
        if (userLocalHour !== 9) {
          skippedCount++;
          continue;
        }

        processedCount++;

        // Get user's calendar connections
        const userConnections = connections.filter((c) => c.user_id === userId);
        if (userConnections.length === 0) {
          continue;
        }

        // Fetch full connection details with tokens
        const connectionIds = userConnections.map((c) => {
          // Find the connection ID - we need to query by user_id and provider
          return { user_id: userId, provider: c.provider };
        });

        const { data: connectionDetails, error: connError } = await adminClient
          .from("calendar_connections")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active");

        if (connError || !connectionDetails || connectionDetails.length === 0) {
          continue;
        }

        // Fetch calendar events for next 24-48 hours
        const nowUtc = new Date();
        const startDate = new Date(nowUtc.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
        const endDate = new Date(nowUtc.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now

        let allEvents: CalendarEvent[] = [];

        // Fetch events from all connected calendars
        for (const connection of connectionDetails) {
          const accessToken = await getValidAccessToken(adminClient, connection as any);
          if (!accessToken) {
            continue;
          }

          let events: CalendarEvent[] = [];
          if (connection.provider === "google") {
            events = await fetchGoogleEvents(
              accessToken,
              startDate,
              endDate,
              userTimezone
            );
          } else if (connection.provider === "outlook") {
            events = await fetchOutlookEvents(
              accessToken,
              startDate,
              endDate,
              userTimezone
            );
          }

          allEvents.push(...events);
        }

        // Filter to working hours if specified
        if (user.work_start_time && user.work_end_time) {
          allEvents = allEvents.filter((event) => {
            const eventStart = new Date(event.start);
            const eventHour = eventStart.getHours();
            const eventMinute = eventStart.getMinutes();
            const eventTimeMinutes = eventHour * 60 + eventMinute;

            const [workStartHour, workStartMin] = user.work_start_time!.split(":").map(Number);
            const [workEndHour, workEndMin] = user.work_end_time!.split(":").map(Number);
            const workStartMinutes = workStartHour * 60 + workStartMin;
            const workEndMinutes = workEndHour * 60 + workEndMin;

            return eventTimeMinutes >= workStartMinutes && eventTimeMinutes <= workEndMinutes;
          });
        }

        // Process each event
        for (const event of allEvents) {
          // Check if event is likely a call
          if (!isLikelyCall(event)) {
            continue;
          }

          // Check if call is 24 hours away (within 12-36 hour window)
          const eventStart = new Date(event.start);
          const hoursUntilCall = (eventStart.getTime() - nowUtc.getTime()) / (1000 * 60 * 60);

          if (hoursUntilCall < 12 || hoursUntilCall > 36) {
            continue; // Too early or too late
          }

          // Match event to lead
          const matchedLead = await matchEventToLead(adminClient, userId, event);
          if (!matchedLead) {
            continue; // No matching lead
          }

          // Check if lead is archived or snoozed
          const { data: lead } = await adminClient
            .from("leads")
            .select("status")
            .eq("id", matchedLead.id)
            .single();

          if (!lead || lead.status !== "ACTIVE") {
            continue; // Lead is archived or snoozed
          }

          // Check if CALL_PREP already exists for this event/lead combination
          const { data: existingActions } = await adminClient
            .from("actions")
            .select("id")
            .eq("user_id", userId)
            .eq("person_id", matchedLead.id)
            .eq("action_type", "CALL_PREP")
            .in("state", ["NEW", "SNOOZED"])
            .gte("due_date", new Date().toISOString().split("T")[0]);

          if (existingActions && existingActions.length > 0) {
            continue; // Already exists
          }

          // Check max pending actions limit (15 per user)
          const { data: pendingActions } = await adminClient
            .from("actions")
            .select("id")
            .eq("user_id", userId)
            .in("state", ["NEW", "SNOOZED"]);

          if (pendingActions && pendingActions.length >= 15) {
            continue; // At limit
          }

          // Calculate due date (day before call)
          const callDate = new Date(event.start);
          callDate.setDate(callDate.getDate() - 1);
          const dueDate = callDate.toISOString().split("T")[0];

          // Create CALL_PREP action
          const { error: createError } = await adminClient.from("actions").insert({
            user_id: userId,
            person_id: matchedLead.id,
            action_type: "CALL_PREP",
            state: "NEW",
            due_date: dueDate,
            auto_created: true,
            notes: `Call with ${matchedLead.name} scheduled for ${new Date(event.start).toLocaleString()}`,
            description: `Prepare for call with ${matchedLead.name}`,
            source: 'calendar',
            source_ref: event.id,
            intent_type: 'schedule',
          });

          if (createError) {
            console.error(
              `[Cron CALL_PREP] Error creating action for user ${userId}:`,
              createError
            );
            errorCount++;
            errors.push({ userId, error: createError.message });
          } else {
            createdCount++;
          }
        }
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ userId, error: errorMessage });
        console.error(`[Cron CALL_PREP] Error processing user ${userId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      created: createdCount,
      skipped: skippedCount,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[Cron CALL_PREP] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
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
    maxResults: 250,
  });

  const events: CalendarEvent[] = [];
  for (const item of response.data.items || []) {
    if (!item.start || !item.end) continue;

    const isAllDay = !item.start.dateTime;

    // Check for video conferencing
    const hangoutLink = item.hangoutLink || null;
    const conferenceData = item.conferenceData;
    const videoConferenceLink =
      hangoutLink || conferenceData?.entryPoints?.[0]?.uri || null;
    const hasVideoConference = !!(
      hangoutLink ||
      (conferenceData && conferenceData.entryPoints && conferenceData.entryPoints.length > 0)
    );

    if (isAllDay) {
      const startDate = item.start.date;
      const endDate = item.end.date;
      if (!startDate || !endDate) continue;

      events.push({
        id: item.id || "",
        title: item.summary || "No title",
        start: startDate,
        end: endDate,
        duration: 0,
        isAllDay: true,
        videoConferenceLink,
        hasVideoConference,
      });
    } else {
      const start = item.start.dateTime;
      const end = item.end.dateTime;
      if (!start || !end) continue;

      const startDateObj = new Date(start);
      const endDateObj = new Date(end);
      const duration = (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60);

      events.push({
        id: item.id || "",
        title: item.summary || "No title",
        start,
        end,
        duration: Math.round(duration),
        isAllDay: false,
        videoConferenceLink,
        hasVideoConference,
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
    .get();

  const events: CalendarEvent[] = [];
  for (const item of (response.value || []) as any[]) {
    if (!item.start || !item.end) continue;

    const isAllDay = !item.start.dateTime;

    // Check for video conferencing (Teams link)
    const onlineMeeting = item.onlineMeeting;
    const videoConferenceLink = onlineMeeting?.joinUrl || null;
    const hasVideoConference = !!onlineMeeting?.joinUrl;

    if (isAllDay) {
      const startDate = item.start.date;
      const endDate = item.end.date;
      if (!startDate || !endDate) continue;

      events.push({
        id: item.id || "",
        title: item.subject || "No title",
        start: startDate,
        end: endDate,
        duration: 0,
        isAllDay: true,
        videoConferenceLink,
        hasVideoConference,
      });
    } else {
      const start = item.start.dateTime;
      const end = item.end.dateTime;
      if (!start || !end) continue;

      const startDateObj = new Date(start);
      const endDateObj = new Date(end);
      const duration = (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60);

      events.push({
        id: item.id || "",
        title: item.subject || "No title",
        start,
        end,
        duration: Math.round(duration),
        isAllDay: false,
        videoConferenceLink,
        hasVideoConference,
      });
    }
  }

  return events;
}

