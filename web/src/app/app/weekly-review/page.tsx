import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GenerateSummaryButton } from "./GenerateSummaryButton";
import { CopyPromptButton } from "./CopyPromptButton";

type WeeklySummary = {
  id: string;
  week_start_date: string;
  days_active: number;
  actions_completed: number;
  replies: number;
  calls_booked: number;
  insight_text: string;
  narrative_summary: string | null;
  next_week_focus: string;
  generated_at: string;
  content_prompts?: Array<{
    id: string;
    type: "WIN_POST" | "INSIGHT_POST";
    content: string;
    status: string;
  }>;
};

function formatWeekRange(weekStartDate: string): string {
  const start = new Date(weekStartDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const endDay = end.getDate();
  const year = start.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

export default async function WeeklyReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?redirect=/app/weekly-review");
  }

  // Fetch the most recent weekly summary
  const { data: summaries, error: fetchError } = await supabase
    .from("weekly_summaries")
    .select("*")
    .eq("user_id", user.id)
    .order("week_start_date", { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error("Error fetching weekly review:", fetchError);
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Weekly Review
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Your Weekly Review
          </h1>
        </header>
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
          <p className="text-zinc-600">
            Failed to load weekly review. Please try again.
          </p>
        </div>
      </div>
    );
  }

  const summary: WeeklySummary | null = summaries && summaries.length > 0 ? summaries[0] : null;

  // Fetch content prompts if summary exists
  let contentPrompts: WeeklySummary["content_prompts"] = [];
  if (summary) {
    const { data: prompts } = await supabase
      .from("content_prompts")
      .select("*")
      .eq("weekly_summary_id", summary.id)
      .eq("status", "DRAFT");
    contentPrompts = prompts || [];
  }

  if (!summary) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Weekly Review
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Your Weekly Review
          </h1>
          <p className="max-w-2xl text-sm text-zinc-600">
            Here&apos;s what you moved forward this week.
          </p>
        </header>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <p className="mb-4 text-lg font-medium text-zinc-900">
            No review available yet
          </p>
          <p className="mb-6 text-sm text-zinc-600">
            Your weekly review will appear here once you&apos;ve completed some
            actions this week.
          </p>
          <GenerateSummaryButton />
        </div>
      </div>
    );
  }

  const weekRange = formatWeekRange(summary.week_start_date);
  const { data: userProfile } = await supabase
    .from("users")
    .select("streak_count")
    .eq("id", user.id)
    .single();
  const currentStreak = userProfile?.streak_count || 0;

  // Attach content prompts to summary for rendering
  const summaryWithPrompts = {
    ...summary,
    content_prompts: contentPrompts,
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Weekly Review
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Your Weekly Review
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600">
          Here&apos;s what you moved forward this week.
        </p>
        <p className="text-xs text-zinc-500">Week of {weekRange}</p>
      </header>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Active days" value={summaryWithPrompts.days_active} />
        <MetricCard
          label="Actions completed"
          value={summaryWithPrompts.actions_completed}
        />
        <MetricCard label="Replies" value={summaryWithPrompts.replies} />
        <MetricCard label="Calls booked" value={summaryWithPrompts.calls_booked} />
        <MetricCard label="Consecutive days" value={`${currentStreak} days`} />
      </div>

      {/* Narrative Summary */}
      {summaryWithPrompts.narrative_summary && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-zinc-900">
            Narrative Summary
          </h2>
          <p className="text-sm leading-relaxed text-zinc-700">
            {summaryWithPrompts.narrative_summary}
          </p>
        </div>
      )}

      {/* Insight */}
      <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-zinc-900">Insight</h2>
        <p className="text-sm font-medium leading-relaxed text-zinc-800">
          {summaryWithPrompts.insight_text}
        </p>
        <p className="mt-2 text-xs text-zinc-600">
          Next week, I&apos;ll prioritize them earlier.
        </p>
      </div>

      {/* Next Week Focus */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-zinc-900">
          Next Week Focus
        </h2>
        <p className="mb-4 text-sm font-medium text-zinc-800">
          &quot;{summaryWithPrompts.next_week_focus}&quot;
        </p>
        <button
          type="button"
          className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
          disabled
        >
          Confirm Focus · Coming soon
        </button>
      </div>

      {/* Content Prompts */}
      {summaryWithPrompts.content_prompts && summaryWithPrompts.content_prompts.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">
            Content Prompts
          </h2>
          <p className="mb-4 text-xs text-zinc-600">
            Simple content ideas from your week
          </p>
          <div className="space-y-4">
            {summaryWithPrompts.content_prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="rounded-lg border border-zinc-100 bg-zinc-50 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                    {prompt.type === "WIN_POST" ? "Win Post" : "Insight Post"}
                  </span>
                </div>
                <p className="mb-3 text-sm text-zinc-700">{prompt.content}</p>
                <div className="flex gap-2">
                  <CopyPromptButton content={prompt.content} />
                  <button
                    type="button"
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                    disabled
                  >
                    Save to Content Ideas · Coming soon
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deeper Insights */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-base font-semibold text-zinc-900">
          Deeper Insights
        </h2>
        <p className="mb-4 text-sm text-zinc-600">
          View deal progression metrics, response time trends, and channel
          effectiveness analytics.
        </p>
        <Link
          href="/app/analytics"
          className="inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
        >
          View Analytics →
        </Link>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 pt-6 text-center">
        <p className="text-base text-zinc-600 italic">
          Small actions add up. Keep the rhythm.
        </p>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-zinc-900">{value}</dd>
    </div>
  );
}

