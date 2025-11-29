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
    .select("onboarding_completed, streak_count")
    .eq("id", user.id)
    .single();

  if (!userProfile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const today = new Date().toISOString().split("T")[0];

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

  // Format calendar availability
  let timeUntilNextEvent = "Calendar not connected";
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
            <p className="text-sm text-amber-800 mb-3">
              No plan generated for today yet.
            </p>
            <Link
              href="/app/plan"
              className="inline-block rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              Generate Daily Plan
            </Link>
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
