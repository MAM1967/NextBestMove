import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StaleActionsSection } from "./StaleActionsSection";
import type { Action } from "../actions/types";

type StaleAction = Action & {
  days_old: number;
};

async function getStaleActions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Calculate date 7 days ago at start of day (00:00:00) in UTC
  // This ensures consistent comparison with TIMESTAMPTZ in the database
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);

  // Fetch stale actions: NEW state, not snoozed, created more than 7 days ago
  // Select all fields to match Action type
  const { data: staleActions, error } = await supabase
    .from("actions")
    .select(
      `
      id,
      user_id,
      person_id,
      action_type,
      state,
      description,
      due_date,
      completed_at,
      snooze_until,
      notes,
      auto_created,
      created_at,
      updated_at,
      person_pins (
        id,
        name,
        url,
        notes
      )
    `
    )
    .eq("user_id", user.id)
    .eq("state", "NEW")
    .is("snooze_until", null) // Not snoozed
    .lt("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching stale actions:", error);
    return null;
  }

  // Calculate how many days old each action is and transform person_pins
  const actionsWithAge = (staleActions || []).map((action: any) => {
    const createdDate = new Date(action.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysOld = Math.floor(
      (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Transform person_pins from array to single object or null
    const personPin = Array.isArray(action.person_pins) && action.person_pins.length > 0
      ? action.person_pins[0]
      : action.person_pins || null;
    
    return {
      ...action,
      person_pins: personPin,
      days_old: daysOld,
    } as StaleAction;
  });

  return actionsWithAge;
}

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?redirect=/app/insights");
  }

  const staleActions = await getStaleActions();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Insights
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600">
          Discover patterns and opportunities to improve your workflow.
        </p>
      </header>

      {/* Stale Actions Insight */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Stale Actions
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Actions older than 7 days that haven&apos;t been prioritized or
              snoozed
            </p>
          </div>
          {staleActions && staleActions.length > 0 && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800">
              {staleActions.length}
            </span>
          )}
        </div>

        {!staleActions ? (
          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-center">
            <p className="text-sm text-zinc-600">
              Unable to load stale actions. Please try again.
            </p>
          </div>
        ) : (
          <StaleActionsSection staleActions={staleActions} />
        )}
      </div>

      {/* Placeholder for future insights */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">
          More Insights Coming Soon
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          We&apos;re working on additional insights to help you understand your
          workflow patterns and optimize your productivity.
        </p>
      </div>
    </div>
  );
}

