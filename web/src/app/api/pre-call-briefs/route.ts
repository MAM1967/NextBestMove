import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasProfessionalFeature } from "@/lib/billing/subscription";
import { getActiveConnection, getValidAccessToken } from "@/lib/calendar/tokens";
import { detectUpcomingCalls } from "@/lib/pre-call-briefs/calendar-detection";
import { generatePreCallBrief } from "@/lib/pre-call-briefs/generation";
import { logError } from "@/lib/utils/logger";
import type { CalendarEvent } from "@/lib/pre-call-briefs/types";
import { google } from "googleapis";
import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

/**
 * GET /api/pre-call-briefs
 * Fetch upcoming pre-call briefs for the next 24 hours
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

    // Check if user has Premium for AI-generated notes
    // Standard users get briefs without AI notes, Premium users get briefs with AI notes
    const { getSubscriptionInfo } = await import("@/lib/billing/subscription");
    const subscription = await getSubscriptionInfo(user.id);
    const isPremium = subscription.plan === "premium" && 
                     (subscription.status === "active" || subscription.status === "trialing") &&
                     !subscription.isReadOnly;

    // Check if calendar is connected
    const connection = await getActiveConnection(supabase, user.id);
    if (!connection) {
      return NextResponse.json({
        success: true,
        briefs: [],
        message: "Connect your calendar to get pre-call briefs",
      });
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase, connection);
    if (!accessToken) {
      return NextResponse.json({
        success: true,
        briefs: [],
        message: "Unable to access calendar",
      });
    }

    // Get user timezone
    const { data: userProfile } = await supabase
      .from("users")
      .select("timezone")
      .eq("id", user.id)
      .single();

    const timezone = userProfile?.timezone || "UTC";

    // Fetch calendar events for next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    let events: CalendarEvent[] = [];

    if (connection.provider === "google") {
      events = await fetchGoogleEvents(accessToken, now, tomorrow, timezone);
    } else if (connection.provider === "outlook") {
      events = await fetchOutlookEvents(accessToken, now, tomorrow, timezone);
    }

    if (events.length === 0) {
      return NextResponse.json({
        success: true,
        briefs: [],
        message: "No upcoming events found",
      });
    }

    // Detect calls and generate briefs
    const adminSupabase = createAdminClient();
    const detectedCalls = await detectUpcomingCalls(
      adminSupabase,
      user.id,
      events
    );

    if (detectedCalls.length === 0) {
      return NextResponse.json({
        success: true,
        briefs: [],
        message: "No calls detected in upcoming events",
      });
    }

    // Generate briefs for detected calls
    // Standard tier: includeAINotes = false (event context only)
    // Premium tier: includeAINotes = true (with AI-generated notes)
    const includeAINotes = isPremium;
    const briefs = await Promise.all(
      detectedCalls.map((call) =>
        generatePreCallBrief(adminSupabase, user.id, call, includeAINotes)
      )
    );

    // Store briefs in database
    const { error: insertError } = await adminSupabase
      .from("pre_call_briefs")
      .upsert(
        briefs.map((brief) => ({
          user_id: user.id,
          calendar_event_id: brief.calendarEventId,
          event_title: brief.eventTitle,
          event_start: brief.eventStart.toISOString(),
          person_pin_id: brief.leadId || brief.personPinId, // Use leadId if available, fallback to personPinId for backward compatibility
          brief_content: brief.briefContent,
          last_interaction_date: brief.lastInteractionDate?.toISOString().split("T")[0] || null,
          follow_up_count: brief.followUpCount,
          next_step_suggestions: brief.nextStepSuggestions,
          user_notes: brief.userNotes,
          has_video_conference: brief.hasVideoConference || false,
        })),
        {
          onConflict: "user_id,calendar_event_id",
        }
      );

    if (insertError) {
      logError("Failed to store pre-call briefs", insertError);
    }

    return NextResponse.json({
      success: true,
      briefs,
      requiresUpgrade: !isPremium,
    });
  } catch (error) {
    logError("Failed to fetch pre-call briefs", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
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

    // Check for video conferencing (Google Meet, Zoom, etc.)
    const hangoutLink = item.hangoutLink || null;
    const conferenceData = item.conferenceData;
    const videoConferenceLink = hangoutLink || conferenceData?.entryPoints?.[0]?.uri || null;
    const hasVideoConference = !!(hangoutLink || (conferenceData && conferenceData.entryPoints && conferenceData.entryPoints.length > 0));

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
    .header("Prefer", `outlook.timezone="${timezone}"`)
    .get();

  const events: CalendarEvent[] = [];
  for (const item of response.value || []) {
    if (!item.start || !item.end) continue;

    const start = item.start.dateTime;
    const end = item.end.dateTime;
    if (!start || !end) continue;

    const isAllDay = item.isAllDay || false;

    // Check for video conferencing (Microsoft Teams, etc.)
    const isOnlineMeeting = item.isOnlineMeeting || false;
    const onlineMeeting = item.onlineMeeting;
    const videoConferenceLink = onlineMeeting?.joinUrl || null;
    const hasVideoConference = isOnlineMeeting || !!videoConferenceLink;

    if (isAllDay) {
      events.push({
        id: item.id || "",
        title: item.subject || "No title",
        start,
        end,
        duration: 0,
        isAllDay: true,
        videoConferenceLink,
        hasVideoConference,
      });
    } else {
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
        videoConferenceLink,
        hasVideoConference,
      });
    }
  }

  return events;
}

