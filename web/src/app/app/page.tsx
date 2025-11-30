import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AppDashboardPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  // Check if user has completed onboarding
  const { data: userProfile } = await supabase
    .from("users")
    .select("onboarding_completed, streak_count, exclude_weekends, calendar_connected, timezone")
    .eq("id", user.id)
    .single();

  if (!userProfile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const today = new Date().toISOString().split("T")[0];
  
  // Check if today is a weekend
  const todayDate = new Date();
  const dayOfWeek = todayDate.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const excludeWeekends = userProfile?.exclude_weekends ?? false;

  // Fetch today's daily plan
  const { data: dailyPlan } = await supabase
    .from("daily_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  // Fetch plan actions if plan exists
  let fastWinCount = 0;
  let regularActionCount = 0;
  let completedCount = 0;
  let fastWinDescription = null;

  if (dailyPlan) {
    const { data: planActions } = await supabase
      .from("daily_plan_actions")
      .select(
        `
        is_fast_win,
        position,
        actions (
          id,
          state,
          action_type,
          description
        )
      `
      )
      .eq("daily_plan_id", dailyPlan.id)
      .order("position", { ascending: true });

    if (planActions) {
      for (const planAction of planActions) {
        const action = planAction.actions as any;
        if (action) {
          if (planAction.is_fast_win) {
            fastWinCount = 1;
            fastWinDescription = action.description;
            if (action.state === "DONE" || action.state === "REPLIED" || action.state === "SENT") {
              completedCount++;
            }
          } else {
            regularActionCount++;
            if (action.state === "DONE" || action.state === "REPLIED" || action.state === "SENT") {
              completedCount++;
            }
          }
        }
      }
    }
  }

  const totalActions = fastWinCount + regularActionCount;
  const progressPercentage = totalActions > 0 ? (completedCount / totalActions) * 100 : 0;

  // Get calendar free minutes from daily plan if available
  const freeMinutes = dailyPlan?.free_minutes ?? null;
  const capacity = dailyPlan?.capacity ?? "default";

  // Check calendar connection status
  const calendarConnected = userProfile?.calendar_connected ?? false;
  
  // Also check calendar_connections table for active connections
  const { data: calendarConnections } = await supabase
    .from("calendar_connections")
    .select("provider, status")
    .eq("user_id", user.id)
    .eq("status", "active");
  
  const hasActiveCalendarConnection = (calendarConnections && calendarConnections.length > 0) || calendarConnected;

  // Fetch next calendar event to show time until next event
  let timeUntilNextEvent = "Calendar not connected";
  
  if (hasActiveCalendarConnection) {
    try {
      // Import calendar functions
      const { getActiveConnection, getValidAccessToken } = await import("@/lib/calendar/tokens");
      const connection = await getActiveConnection(supabase, user.id);
      
      if (connection) {
        const accessToken = await getValidAccessToken(supabase, connection);
        
        if (accessToken) {
          // Get user timezone
          const userTimezone = userProfile?.timezone || "UTC";
          const now = new Date();
          
          // Fetch events from calendar API
          let nextEventStart: Date | null = null;
          let nextEventIsAllDay = false;
          
          if (connection.provider === "google") {
            const { google } = await import("googleapis");
            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({ access_token: accessToken });
            const calendar = google.calendar({ version: "v3", auth: oauth2Client });
            
            const response = await calendar.events.list({
              calendarId: "primary",
              timeMin: now.toISOString(),
              timeMax: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next 7 days to catch all-day events
              timeZone: userTimezone,
              singleEvents: true,
              orderBy: "startTime",
              maxResults: 20,
            });
            
            // Find first event (timed or all-day)
            for (const item of response.data.items || []) {
              if (item.start?.dateTime) {
                // Timed event
                const eventStart = new Date(item.start.dateTime);
                if (eventStart > now) {
                  nextEventStart = eventStart;
                  nextEventIsAllDay = false;
                  break;
                }
              } else if (item.start?.date) {
                // All-day event - start is at midnight of that day
                const eventDateStr = item.start.date;
                const eventDate = new Date(eventDateStr + "T00:00:00");
                // Get today at midnight in user's timezone for comparison
                const todayStr = new Intl.DateTimeFormat("en-CA", {
                  timeZone: userTimezone,
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).format(now);
                const todayAtMidnight = new Date(todayStr + "T00:00:00");
                
                // Include if event is today or in the future
                if (eventDate >= todayAtMidnight) {
                  nextEventStart = eventDate;
                  nextEventIsAllDay = true;
                  break;
                }
              }
            }
          } else if (connection.provider === "outlook") {
            const { Client } = await import("@microsoft/microsoft-graph-client");
            // Ensure fetch is available for Microsoft Graph client
            if (typeof globalThis.fetch === 'undefined') {
              await import("isomorphic-fetch" as any);
            }
            
            const client = Client.init({
              authProvider: (done) => {
                done(null, accessToken);
              },
            });
            
            const response = await client
              .api("/me/calendar/calendarView")
              .query({
                startDateTime: now.toISOString(),
                endDateTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              })
              .header("Prefer", `outlook.timezone="${userTimezone}"`)
              .top(20)
              .get();
            
            // Find first event (timed or all-day)
            for (const item of response.value || []) {
              if (item.start?.dateTime) {
                const eventStart = new Date(item.start.dateTime);
                const isAllDay = item.isAllDay || false;
                
                if (eventStart > now) {
                  nextEventStart = eventStart;
                  nextEventIsAllDay = isAllDay;
                  break;
                }
              }
            }
          }
          
          // Format time until next event
          if (nextEventStart) {
            if (nextEventIsAllDay) {
              // For all-day events, show the date or relative time
              const todayStr = new Intl.DateTimeFormat("en-CA", {
                timeZone: userTimezone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).format(now);
              const eventDateStr = new Intl.DateTimeFormat("en-CA", {
                timeZone: userTimezone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).format(nextEventStart);
              
              if (eventDateStr === todayStr) {
                timeUntilNextEvent = "All day today";
              } else {
                // Calculate days until event
                const todayAtMidnight = new Date(todayStr + "T00:00:00");
                const eventAtMidnight = new Date(eventDateStr + "T00:00:00");
                const diffMs = eventAtMidnight.getTime() - todayAtMidnight.getTime();
                const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                
                if (days === 1) {
                  timeUntilNextEvent = "All day tomorrow";
                } else if (days < 7) {
                  // Show day name
                  const dayName = new Intl.DateTimeFormat("en-US", {
                    timeZone: userTimezone,
                    weekday: "long",
                  }).format(nextEventStart);
                  timeUntilNextEvent = `All day ${dayName}`;
                } else {
                  // Show date
                  const dateStr = new Intl.DateTimeFormat("en-US", {
                    timeZone: userTimezone,
                    month: "short",
                    day: "numeric",
                  }).format(nextEventStart);
                  timeUntilNextEvent = `All day ${dateStr}`;
                }
              }
            } else {
              // Timed event - show time until
              const diffMs = nextEventStart.getTime() - now.getTime();
              const minutes = Math.floor(diffMs / (1000 * 60));
              
              if (minutes < 0) {
                timeUntilNextEvent = "No upcoming events";
              } else if (minutes < 60) {
                timeUntilNextEvent = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
              } else if (minutes < 1440) {
                const hours = Math.floor(minutes / 60);
                const remainingMinutes = minutes % 60;
                if (remainingMinutes === 0) {
                  timeUntilNextEvent = `${hours} hour${hours !== 1 ? 's' : ''}`;
                } else {
                  timeUntilNextEvent = `${hours}h ${remainingMinutes}m`;
                }
              } else {
                const days = Math.floor(minutes / 1440);
                timeUntilNextEvent = `${days} day${days !== 1 ? 's' : ''}`;
              }
            }
          } else {
            timeUntilNextEvent = "No upcoming events";
          }
        } else {
          // Calendar connected but can't access - fall back to availability
          if (freeMinutes !== null) {
            if (freeMinutes < 30) {
              timeUntilNextEvent = "Very busy day";
            } else if (freeMinutes < 60) {
              timeUntilNextEvent = "Light availability";
            } else if (freeMinutes < 120) {
              timeUntilNextEvent = "Standard availability";
            } else {
              timeUntilNextEvent = "Good availability";
            }
          } else {
            timeUntilNextEvent = "Calendar connected";
          }
        }
      }
    } catch (error) {
      console.error("Error fetching next calendar event:", error);
      // Fall back to showing calendar connected status or availability
      if (freeMinutes !== null) {
        if (freeMinutes < 30) {
          timeUntilNextEvent = "Very busy day";
        } else if (freeMinutes < 60) {
          timeUntilNextEvent = "Light availability";
        } else if (freeMinutes < 120) {
          timeUntilNextEvent = "Standard availability";
        } else {
          timeUntilNextEvent = "Good availability";
        }
      } else {
        timeUntilNextEvent = "Calendar connected";
      }
    }
  }
  
  // Fallback to free minutes display if no next event found
  if (timeUntilNextEvent === "Calendar not connected" && freeMinutes !== null) {
    if (freeMinutes < 30) {
      timeUntilNextEvent = "Very busy day";
    } else if (freeMinutes < 60) {
      timeUntilNextEvent = "Light availability";
    } else if (freeMinutes < 120) {
      timeUntilNextEvent = "Standard availability";
    } else {
      timeUntilNextEvent = "Good availability";
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Today&apos;s next best move
        </h1>
        <p className="text-sm text-zinc-600">
          {dailyPlan
            ? `You have ${totalActions} action${totalActions !== 1 ? "s" : ""} planned for today`
            : "Generate your daily plan to get started"}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-900">Suggested focus</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {dailyPlan?.focus_statement ||
              "Complete your daily plan to see your focus for today"}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-900">
            Time until next event
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            {timeUntilNextEvent}
          </p>
          {freeMinutes !== null && (
            <p className="mt-1 text-xs text-zinc-500">
              {freeMinutes} minutes available today
            </p>
          )}
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-900">Current streak</h2>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            🔥 {userProfile?.streak_count ?? 0}
          </p>
          <p className="mt-1 text-xs text-zinc-500">day{userProfile?.streak_count !== 1 ? "s" : ""}</p>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-zinc-900">
            Today&apos;s plan
          </h2>
          {dailyPlan && (
            <Link
              href="/app/plan"
              className="text-xs font-medium text-purple-700 hover:text-purple-800 hover:underline"
            >
              View full plan →
            </Link>
          )}
        </div>

        {!dailyPlan && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            {isWeekend && excludeWeekends ? (
              <>
                <p className="text-sm text-amber-800 mb-2">
                  Plans aren&apos;t generated on weekends based on your preferences.
                </p>
                <p className="text-xs text-amber-700">
                  You can change this setting in your account preferences if you&apos;d like to receive plans on weekends.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-amber-800 mb-3">
                  No plan generated for today yet.
                </p>
                <Link
                  href="/app/plan"
                  className="inline-block rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                >
                  Generate Daily Plan
                </Link>
              </>
            )}
          </div>
        )}

        {dailyPlan && totalActions === 0 && (
          <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm text-zinc-600">
              Your plan has been generated but no actions are available yet. Add some pins to get started.
            </p>
          </div>
        )}

        {dailyPlan && totalActions > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">Progress</span>
              <span className="font-semibold text-zinc-900">
                {completedCount} of {totalActions} completed
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-full bg-purple-600 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
              />
            </div>
            {fastWinCount > 0 && fastWinDescription && (
              <div className="mt-3 rounded-lg border-2 border-purple-200 bg-purple-50 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-900">
                    FAST WIN
                  </span>
                </div>
                <p className="text-sm text-zinc-700">
                  {fastWinDescription}
                </p>
              </div>
            )}
            {regularActionCount > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-zinc-500 mb-2">
                  {regularActionCount} regular action{regularActionCount !== 1 ? "s" : ""}
                </p>
                <Link
                  href="/app/plan"
                  className="text-sm text-purple-700 hover:text-purple-800 hover:underline"
                >
                  View all actions →
                </Link>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
