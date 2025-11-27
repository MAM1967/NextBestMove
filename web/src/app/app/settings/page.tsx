import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fetchCalendarStatus } from "@/lib/calendar/status";
import { CalendarConnectionSection } from "./CalendarConnectionSection";

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

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?redirect=/app/settings");
  }

  const [{ data: profile }, calendarStatus] = await Promise.all([
    supabase
      .from("users")
      .select("email, name, timezone, streak_count, calendar_connected")
      .eq("id", user.id)
      .single(),
    fetchCalendarStatus(supabase, user.id),
  ]);

  const connections: CalendarConnection[] = calendarStatus.connections || [];

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
          description="Basic account metadata pulled from Supabase auth + profile."
        >
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-zinc-500">Name</dt>
              <dd className="font-medium text-zinc-900">
                {profile?.name ?? user.email}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Email</dt>
              <dd className="font-medium text-zinc-900">{profile?.email}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Timezone</dt>
              <dd className="font-medium text-zinc-900">
                {profile?.timezone ?? "Not set"}
              </dd>
            </div>
          </dl>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            Timezone editing and account deletion controls will live here soon.
          </div>
        </SectionCard>

        <SectionCard
          title="Calendar connection"
          description="Used to size your daily plan once OAuth flows are enabled."
        >
          <CalendarConnectionSection
            connections={connections}
            connected={calendarStatus.connected}
            status={calendarStatus.status || "disconnected"}
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Notification preferences"
        description="Toggles only appear for awareness until the notification service is wired up."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <PlaceholderToggle
            label="Morning plan"
            description="Daily at 8am in your timezone."
            enabled
          />
          <PlaceholderToggle
            label="Fast win reminder"
            description="Nudge at 2pm if today’s fast win is untouched."
          />
          <PlaceholderToggle
            label="Follow-up alerts"
            description="Reminder when replies are overdue."
            enabled
          />
          <PlaceholderToggle
            label="Weekly summary"
            description="Sunday night recap."
            enabled
          />
        </div>
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
                On · Coming soon
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Prompts appear when you complete at least six actions in a week.
            </p>
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
        description="Download your pins, actions, and summaries. Endpoint is stubbed until implemented."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-zinc-600">
            JSON export will include pins, actions, plans, and summaries.
          </div>
          <button
            type="button"
            disabled
            className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-600"
          >
            Export JSON (coming soon)
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
