import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { fetchCalendarStatus } from "@/lib/calendar/status";
import { CalendarConnectionSection } from "./CalendarConnectionSection";
import { CalendarEventsView } from "./CalendarEventsView";
import { BillingSection } from "./BillingSection";
import { WeekendPreferenceToggle } from "./WeekendPreferenceToggle";
import { ExportDataButton } from "./ExportDataButton";
import { BYOKSection } from "./BYOKSection";
import { EmailPreferencesSection } from "./EmailPreferencesSection";
import { AccountDeletionSection } from "./AccountDeletionSection";
import { AccountOverviewSection } from "./AccountOverviewSection";
import { VoiceLearningSection } from "./VoiceLearningSection";

type SearchParams = Promise<{ calendar?: string }>;

type CalendarConnection = {
  provider: string;
  status: string;
  last_sync_at: string | null;
  error_message: string | null;
};

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4 space-y-1">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {description && <p className="text-sm text-zinc-600">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function PlaceholderToggle({
  label,
  description,
  enabled,
}: {
  label: string;
  description?: string;
  enabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-zinc-200 px-4 py-3">
      <div className="space-y-1 text-sm">
        <p className="font-medium text-zinc-900">{label}</p>
        {description && <p className="text-xs text-zinc-600">{description}</p>}
      </div>
      <button
        type="button"
        disabled
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
          enabled
            ? "border-purple-200 bg-purple-50 text-purple-700"
            : "border-zinc-200 bg-white text-zinc-500"
        }`}
      >
        {enabled ? "On" : "Off"} · Coming soon
      </button>
    </div>
  );
}

function CalendarStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700 border-green-200",
    expired: "bg-amber-100 text-amber-700 border-amber-200",
    error: "bg-red-100 text-red-700 border-red-200",
    disconnected: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
        map[status] ?? "bg-zinc-100 text-zinc-600 border-zinc-200"
      }`}
    >
      {status}
    </span>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const calendarStatusParam = params.calendar; // "success" or "error"
  
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?redirect=/app/settings");
  }

  const [{ data: profile }, calendarStatus, { data: billingCustomer }, { count: contentPromptsCount }] =
    await Promise.all([
      supabase
        .from("users")
        .select(
          "email, name, timezone, work_start_time, work_end_time, time_format_preference, streak_count, calendar_connected, exclude_weekends, ai_provider, ai_api_key_encrypted, ai_model, email_morning_plan, email_fast_win_reminder, email_follow_up_alerts, email_weekly_summary, email_unsubscribed"
        )
        .eq("id", user.id)
        .single(),
      fetchCalendarStatus(supabase, user.id),
      supabase
        .from("billing_customers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("content_prompts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

  const connections: CalendarConnection[] = calendarStatus.connections || [];

  // Fetch subscription data if customer exists
  let subscriptionData = null;
  let isPremium = false;
  if (billingCustomer) {
    // First try to get active or trialing subscription
    const { data: activeSubscription } = await supabase
      .from("billing_subscriptions")
      .select(
        `
        id,
        status,
        current_period_end,
        trial_ends_at,
        cancel_at_period_end,
        metadata
      `
      )
      .eq("billing_customer_id", billingCustomer.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (activeSubscription) {
      subscriptionData = activeSubscription;
      const planType = (activeSubscription.metadata as any)?.plan_type;
      isPremium = planType === "premium";
    } else {
      // If no active/trialing, get the most recent one (including canceled)
      const { data: latestSubscription } = await supabase
        .from("billing_subscriptions")
        .select(
          `
          id,
          status,
          current_period_end,
          trial_ends_at,
          cancel_at_period_end,
          metadata
        `
        )
        .eq("billing_customer_id", billingCustomer.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      subscriptionData = latestSubscription;
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Settings
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Tune how NextBestMove works for you
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600">
          Manage calendar connections, notification preferences, timezone, data
          exports, and more. Many controls are placeholders until the
          corresponding services are wired up.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard
          title="Account overview"
          description="Manage your account details, password, and timezone."
        >
          <AccountOverviewSection
            name={profile?.name || null}
            email={profile?.email || user.email}
            timezone={profile?.timezone || null}
            workStartTime={profile?.work_start_time ? profile.work_start_time.substring(0, 5) : null}
            workEndTime={profile?.work_end_time ? profile.work_end_time.substring(0, 5) : null}
            timeFormatPreference={(profile?.time_format_preference as "12h" | "24h") || null}
          />
        </SectionCard>

        <SectionCard
          title="Calendar connection and preferences"
          description="Connect your calendar and configure planning preferences."
        >
          <div className="space-y-4">
            {calendarStatusParam === "error" && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <p className="font-medium">Failed to connect calendar</p>
                <p className="mt-1 text-xs text-red-700">
                  Please check the error message below and try again. If the problem persists, check the server logs.
                </p>
              </div>
            )}
            {calendarStatusParam === "success" && calendarStatus.connected && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <p className="font-medium">Calendar connected successfully!</p>
              </div>
            )}
            <CalendarConnectionSection
              connections={connections}
              connected={calendarStatus.connected}
              status={calendarStatus.status || "disconnected"}
            />
            <div className="border-t border-zinc-200 pt-4">
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <WeekendPreferenceToggle
                  excludeWeekends={profile?.exclude_weekends ?? false}
                />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Calendar Events View - Hidden but available for future use (e.g., work hours implementation) */}
      {/* {calendarStatus.connected && (
        <SectionCard
          title="Calendar events & availability"
          description="View your upcoming events and how they affect your daily action capacity."
        >
          <CalendarEventsView />
        </SectionCard>
      )} */}

      <SectionCard
        title="Billing & subscription"
        description="Manage your subscription, payment method, and billing history."
      >
        <BillingSection
          subscription={subscriptionData}
          hasCustomer={!!billingCustomer}
        />
      </SectionCard>

      <SectionCard
        title="Email preferences"
        description="Control which emails you receive from NextBestMove."
      >
        <EmailPreferencesSection
          initialPreferences={{
            email_morning_plan: profile?.email_morning_plan ?? true,
            email_fast_win_reminder: profile?.email_fast_win_reminder ?? true,
            email_follow_up_alerts: profile?.email_follow_up_alerts ?? true,
            email_weekly_summary: profile?.email_weekly_summary ?? true,
            email_unsubscribed: profile?.email_unsubscribed ?? false,
          }}
        />
      </SectionCard>

      <SectionCard
        title="AI preferences"
        description="Configure how AI features work for you. Premium users can bring their own API key."
      >
        <BYOKSection
          isPremium={isPremium}
          currentProvider={profile?.ai_provider}
          currentModel={profile?.ai_model}
          hasApiKey={!!profile?.ai_api_key_encrypted}
        />
      </SectionCard>

      <SectionCard
        title="Content & voice learning"
        description="AI learns your writing style to generate content that sounds like you. Premium feature."
      >
        <VoiceLearningSection isPremium={isPremium} />
      </SectionCard>

      <SectionCard
        title="Content prompts & streak"
        description="Motivation tools live here. Content prompts require ≥6 completed actions/week."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  Content prompts
                </p>
                <p className="text-xs text-zinc-600">
                  Include content ideas in weekly summary emails.
                </p>
              </div>
              <button
                type="button"
                disabled
                className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-600"
              >
                Coming soon
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Prompts appear when you complete at least six actions in a week.
            </p>
            {contentPromptsCount !== null && contentPromptsCount > 0 && (
              <p className="text-xs font-medium text-zinc-700">
                {contentPromptsCount} prompt{contentPromptsCount !== 1 ? "s" : ""} saved
              </p>
            )}
            {contentPromptsCount === 0 && (
              <p className="text-xs text-zinc-500 italic">
                Save prompts from weekly summaries to see them here
              </p>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center gap-2 text-3xl font-semibold text-zinc-900">
              🔥 {profile?.streak_count ?? 0}
              <span className="text-base font-normal text-zinc-500">
                day streak
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Best streak & history charts will show here once streak analytics
              ship.
            </p>
            <button
              type="button"
              disabled
              className="inline-flex items-center text-xs font-semibold text-purple-700"
            >
              View streak history (soon)
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Data export & backups"
        description="Download your pins, actions, and summaries as JSON."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-zinc-600">
            JSON export includes pins, actions, plans, and summaries.
          </div>
          <ExportDataButton />
        </div>
      </SectionCard>

      <SectionCard
        title="Account deletion"
        description="Permanently delete your account and all data. This action cannot be undone."
      >
        <AccountDeletionSection />
      </SectionCard>

      <footer className="border-t border-zinc-200 pt-6">
        <div className="flex flex-col items-center gap-4 text-sm text-zinc-600">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between w-full">
            <p>© MAM Growth Strategies LLC 2025</p>
            <div className="flex gap-6">
              <Link
                href="/terms"
                className="hover:text-zinc-900 hover:underline"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="hover:text-zinc-900 hover:underline"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
          <p className="text-sm text-zinc-500">This site uses privacy-friendly analytics</p>
        </div>
      </footer>
    </div>
  );
}
