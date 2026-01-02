import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSubscriptionInfo as getServerSubscriptionInfo } from "@/lib/billing/subscription";
import { getSubscriptionInfo } from "@/lib/billing/subscription-status";
import { GracePeriodBanner } from "./components/GracePeriodBanner";
import { BillingAlertBannerClient } from "./components/BillingAlertBannerClient";
import { PaymentFailureModalClient } from "./components/PaymentFailureModalClient";
import { GlobalRollup } from "./components/GlobalRollup";
import { ChannelNudgesList } from "./components/ChannelNudgeCard";
import { BestActionCardClient } from "./components/BestActionCardClient";

export default async function TodayPage() {
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
    .select(
      "onboarding_completed, streak_count, exclude_weekends, calendar_connected, timezone"
    )
    .eq("id", user.id)
    .single();

  if (!userProfile?.onboarding_completed) {
    redirect("/onboarding");
  }

  // Fetch subscription status for grace period check and billing alerts
  let serverSubscriptionInfo;
  try {
    serverSubscriptionInfo = await getServerSubscriptionInfo(user.id);
  } catch (error) {
    console.error("Error fetching subscription info:", error);
    // Fallback to default values
    serverSubscriptionInfo = {
      status: "none" as const,
      plan: "none" as const,
      trialEndsAt: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      isReadOnly: false,
    };
  }

  // Get subscription data for client-side helpers
  const { data: billingCustomer } = await supabase
    .from("billing_customers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  let subscriptionInfo = null;
  let showPaymentFailureModal = false;
  if (billingCustomer) {
    const { data: subscription } = await supabase
      .from("billing_subscriptions")
      .select("status, trial_ends_at, metadata")
      .eq("billing_customer_id", billingCustomer.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscription) {
      subscriptionInfo = getSubscriptionInfo(
        subscription.status,
        subscription.trial_ends_at
      );
      
      // Check if Day 3 payment failure modal should be shown
      try {
        const metadata = subscription.metadata as any;
        showPaymentFailureModal = 
          subscription.status === "past_due" &&
          metadata?.show_payment_failure_modal === true;
      } catch (error) {
        console.error("Error checking payment failure modal:", error);
        showPaymentFailureModal = false;
      }
    }
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
            if (
              action.state === "DONE" ||
              action.state === "REPLIED" ||
              action.state === "SENT"
            ) {
              completedCount++;
            }
          } else {
            regularActionCount++;
            if (
              action.state === "DONE" ||
              action.state === "REPLIED" ||
              action.state === "SENT"
            ) {
              completedCount++;
            }
          }
        }
      }
    }
  }

  const totalActions = fastWinCount + regularActionCount;
  const progressPercentage =
    totalActions > 0 ? (completedCount / totalActions) * 100 : 0;

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

  const hasActiveCalendarConnection =
    (calendarConnections && calendarConnections.length > 0) ||
    calendarConnected;

  // Fetch next calendar event to show time until next event
  let timeUntilNextEvent = "Calendar not connected";
  let todayEventCount = 0;

  if (hasActiveCalendarConnection) {
    try {
      // Import calendar functions
      const { getActiveConnection, getValidAccessToken } = await import(
        "@/lib/calendar/tokens"
      );
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
            const calendar = google.calendar({
              version: "v3",
              auth: oauth2Client,
            });

            // Get today's date range in user's timezone
            const todayStr = new Intl.DateTimeFormat("en-CA", {
              timeZone: userTimezone,
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(now);
            const [todayYear, todayMonth, todayDay] = todayStr.split("-").map(Number);
            const todayStart = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay, 0, 0, 0));
            const todayEnd = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay, 23, 59, 59));

            const response = await calendar.events.list({
              calendarId: "primary",
              timeMin: todayStart.toISOString(),
              timeMax: new Date(
                now.getTime() + 7 * 24 * 60 * 60 * 1000
              ).toISOString(), // Next 7 days to catch all-day events
              timeZone: userTimezone,
              singleEvents: true,
              orderBy: "startTime",
              maxResults: 50,
            });

            // Count events for today and find first event
            for (const item of response.data.items || []) {
              // Check if event is today
              let isToday = false;
              if (item.start?.dateTime) {
                const eventStart = new Date(item.start.dateTime);
                isToday = eventStart >= todayStart && eventStart <= todayEnd;
              } else if (item.start?.date) {
                const eventDateStr = item.start.date;
                isToday = eventDateStr === todayStr;
              }
              if (isToday) {
                todayEventCount++;
              }
              if (item.start?.dateTime) {
                // Timed event
                const eventStart = new Date(item.start.dateTime);
                if (eventStart > now) {
                  nextEventStart = eventStart;
                  nextEventIsAllDay = false;
                  break;
                }
              } else if (item.start?.date) {
                // All-day event - date is in YYYY-MM-DD format
                const eventDateStr = item.start.date;
                // Parse the date string to create a Date object at noon UTC to avoid timezone issues
                const [year, month, day] = eventDateStr.split("-").map(Number);
                const eventDate = new Date(
                  Date.UTC(year, month - 1, day, 12, 0, 0)
                );

                // Get today's date string in user's timezone
                const todayStr = new Intl.DateTimeFormat("en-CA", {
                  timeZone: userTimezone,
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).format(now);
                const [todayYear, todayMonth, todayDay] = todayStr
                  .split("-")
                  .map(Number);
                const todayAtNoon = new Date(
                  Date.UTC(todayYear, todayMonth - 1, todayDay, 12, 0, 0)
                );

                // Include if event is today or in the future
                if (eventDate >= todayAtNoon) {
                  nextEventStart = eventDate;
                  nextEventIsAllDay = true;
                  break;
                }
              }
            }
          } else if (connection.provider === "outlook") {
            const { Client } = await import(
              "@microsoft/microsoft-graph-client"
            );
            // Ensure fetch is available for Microsoft Graph client
            if (typeof globalThis.fetch === "undefined") {
              await import("isomorphic-fetch" as any);
            }

            const client = Client.init({
              authProvider: (done) => {
                done(null, accessToken);
              },
            });

            // Get today's date range in user's timezone
            const todayStr = new Intl.DateTimeFormat("en-CA", {
              timeZone: userTimezone,
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(now);
            const [todayYear, todayMonth, todayDay] = todayStr.split("-").map(Number);
            const todayStart = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay, 0, 0, 0));
            const todayEnd = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay, 23, 59, 59));

            const response = await client
              .api("/me/calendar/calendarView")
              .query({
                startDateTime: todayStart.toISOString(),
                endDateTime: new Date(
                  now.getTime() + 7 * 24 * 60 * 60 * 1000
                ).toISOString(),
              })
              .header("Prefer", `outlook.timezone="${userTimezone}"`)
              .top(50)
              .get();

            // Count events for today and find first event
            for (const item of response.value || []) {
              // Check if event is today
              if (item.start?.dateTime) {
                const eventStart = new Date(item.start.dateTime);
                const isToday = eventStart >= todayStart && eventStart <= todayEnd;
                if (isToday) {
                  todayEventCount++;
                }
              } else if (item.isAllDay) {
                // All-day event - check if date matches today
                const eventDateStr = new Intl.DateTimeFormat("en-CA", {
                  timeZone: userTimezone,
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).format(new Date(item.start.dateTime));
                if (eventDateStr === todayStr) {
                  todayEventCount++;
                }
              }
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
              // Get today's date in user's timezone
              const todayStr = new Intl.DateTimeFormat("en-CA", {
                timeZone: userTimezone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }).format(now);

              // Get event date in user's timezone
              // For Google Calendar all-day events, item.start.date is already YYYY-MM-DD
              // For Outlook, we need to format the dateTime
              let eventDateStr: string;
              if (connection.provider === "google") {
                // For Google, we already have the date string from item.start.date
                // Parse it from the Date object we created
                eventDateStr = new Intl.DateTimeFormat("en-CA", {
                  timeZone: userTimezone,
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).format(nextEventStart);
              } else {
                // For Outlook, format the dateTime
                eventDateStr = new Intl.DateTimeFormat("en-CA", {
                  timeZone: userTimezone,
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).format(nextEventStart);
              }

              if (eventDateStr === todayStr) {
                timeUntilNextEvent = "All day today";
              } else {
                // Calculate days until event by comparing date strings
                // Parse dates as YYYY-MM-DD and calculate difference
                // Use UTC dates at noon to avoid timezone/DST issues
                const [todayYear, todayMonth, todayDay] = todayStr
                  .split("-")
                  .map(Number);
                const [eventYear, eventMonth, eventDay] = eventDateStr
                  .split("-")
                  .map(Number);

                // Create dates at noon UTC to avoid timezone/DST issues
                const todayDate = new Date(
                  Date.UTC(todayYear, todayMonth - 1, todayDay, 12, 0, 0)
                );
                const eventDate = new Date(
                  Date.UTC(eventYear, eventMonth - 1, eventDay, 12, 0, 0)
                );

                const diffMs = eventDate.getTime() - todayDate.getTime();
                const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                // Debug logging
                console.log("All-day event date calculation:", {
                  todayStr,
                  eventDateStr,
                  days,
                  todayDate: todayDate.toISOString(),
                  eventDate: eventDate.toISOString(),
                });

                if (days === 1) {
                  timeUntilNextEvent = "All day tomorrow";
                } else if (days < 7 && days > 0) {
                  // Show day name
                  const dayName = new Intl.DateTimeFormat("en-US", {
                    timeZone: userTimezone,
                    weekday: "long",
                  }).format(nextEventStart);
                  timeUntilNextEvent = `All day ${dayName}`;
                } else if (days > 0) {
                  // Show date
                  const dateStr = new Intl.DateTimeFormat("en-US", {
                    timeZone: userTimezone,
                    month: "short",
                    day: "numeric",
                  }).format(nextEventStart);
                  timeUntilNextEvent = `All day ${dateStr}`;
                } else {
                  // Shouldn't happen, but fallback
                  timeUntilNextEvent = "All day today";
                }
              }
            } else {
              // Timed event - show time until
              const diffMs = nextEventStart.getTime() - now.getTime();
              const minutes = Math.floor(diffMs / (1000 * 60));

              if (minutes < 0) {
                timeUntilNextEvent = "No upcoming events";
              } else if (minutes < 60) {
                timeUntilNextEvent = `${minutes} minute${
                  minutes !== 1 ? "s" : ""
                }`;
              } else if (minutes < 1440) {
                const hours = Math.floor(minutes / 60);
                const remainingMinutes = minutes % 60;
                if (remainingMinutes === 0) {
                  timeUntilNextEvent = `${hours} hour${hours !== 1 ? "s" : ""}`;
                } else {
                  timeUntilNextEvent = `${hours}h ${remainingMinutes}m`;
                }
              } else {
                const days = Math.floor(minutes / 1440);
                timeUntilNextEvent = `${days} day${days !== 1 ? "s" : ""}`;
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
      {/* Grace Period Banner */}
      {subscriptionInfo?.isInGracePeriod && (
        <GracePeriodBanner
          daysRemaining={subscriptionInfo.daysUntilGracePeriodEnds ?? 0}
        />
      )}

      {/* Payment Failure Modal (Day 3) */}
      {showPaymentFailureModal && (
        <PaymentFailureModalClient showModal={showPaymentFailureModal} />
      )}

      {/* Billing Alert Banners */}
      {serverSubscriptionInfo.status === "past_due" && (
        <BillingAlertBannerClient
          status="past_due"
          currentPeriodEnd={serverSubscriptionInfo.currentPeriodEnd}
        />
      )}
      {serverSubscriptionInfo.cancelAtPeriodEnd &&
        serverSubscriptionInfo.status === "active" && (
          <BillingAlertBannerClient
            status="cancel_at_period_end"
            currentPeriodEnd={serverSubscriptionInfo.currentPeriodEnd}
          />
        )}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Today&apos;s next best move
        </h1>
        <p className="text-sm text-zinc-600">
          {dailyPlan
            ? `You have ${totalActions} action${
                totalActions !== 1 ? "s" : ""
              } planned for today`
            : "Generate your daily plan to get started"}
        </p>
      </header>

      {/* Best Action - Single clear next move */}
      <BestActionCardClient />

      {/* Global Rollup - Top overdue items across relationships */}
      <GlobalRollup />

      <ChannelNudgesList />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-900">Suggested focus</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {dailyPlan?.focus_statement ||
              "Complete your daily plan to see your focus for today"}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-900">Calendar</h2>
          {hasActiveCalendarConnection ? (
            <>
              <p className="mt-1 text-sm text-zinc-600">
                {todayEventCount} event{todayEventCount !== 1 ? "s" : ""} today
              </p>
              <p className="mt-1 text-xs text-zinc-500">{timeUntilNextEvent}</p>
              {freeMinutes !== null && (
                <p className="mt-1 text-xs text-zinc-500">
                  {freeMinutes} min available
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-sm text-zinc-600">Not connected</p>
          )}
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-900">Capacity</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {capacity === "auto"
              ? "Auto"
              : capacity === "micro"
              ? "Micro"
              : capacity === "light"
              ? "Light"
              : capacity === "standard"
              ? "Standard"
              : capacity === "heavy"
              ? "Heavy"
              : "Default"}
          </p>
          {capacity === "auto" && freeMinutes !== null && (
            <p className="mt-1 text-xs text-zinc-500">
              Based on {freeMinutes} min available
            </p>
          )}
        </div>
      </section>

      {/* Today's Plan Summary - Compact view */}
      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-900">
              Today&apos;s plan
            </h2>
            {dailyPlan ? (
              <p className="mt-1 text-sm text-zinc-600">
                {totalActions} action{totalActions !== 1 ? "s" : ""} planned today
                {completedCount > 0 && (
                  <span className="ml-2">
                    ({completedCount} completed)
                  </span>
                )}
              </p>
            ) : (
              <p className="mt-1 text-sm text-zinc-600">
                {isWeekend && excludeWeekends
                  ? "Plans aren't generated on weekends"
                  : "No plan generated yet"}
              </p>
            )}
          </div>
          <Link
            href="/app/plan"
            className="text-sm font-medium text-purple-700 hover:text-purple-800 hover:underline"
          >
            {dailyPlan ? "View full plan →" : "Generate plan →"}
          </Link>
        </div>
      </section>
    </div>
  );
}
