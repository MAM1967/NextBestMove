"use client";

import { useState, useEffect } from "react";
import { UnifiedActionCard } from "../components/UnifiedActionCard";
import { FollowUpFlowModal } from "../actions/FollowUpFlowModal";
import { FollowUpSchedulingModal } from "../actions/FollowUpSchedulingModal";
import { SnoozeActionModal } from "../actions/SnoozeActionModal";
import { ActionNoteModal } from "../actions/ActionNoteModal";
import { PaywallOverlay } from "../components/PaywallOverlay";
import { CelebrationBanner } from "../components/CelebrationBanner";
import { PreCallBriefCarousel } from "../components/PreCallBriefCarousel";
import { PreCallBriefModal } from "../components/PreCallBriefModal";
import { CapacityOverrideControl } from "../components/CapacityOverrideControl";
import { DurationSelector } from "../components/DurationSelector";
import { Action } from "../actions/types";
import type { PreCallBrief } from "@/lib/pre-call-briefs/types";
import type { CapacityLevel } from "@/lib/plan/capacity";

interface DailyPlan {
  id: string;
  user_id: string;
  date: string;
  focus_statement?: string | null;
  capacity?: string | null;
  free_minutes?: number | null;
  generated_at: string;
  actions?: Action[];
  fast_win?: Action;
}

export default function DailyPlanPage() {
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklyFocus, setWeeklyFocus] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    "none" | "trialing" | "active" | "past_due" | "canceled"
  >("none");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Modal states
  const [followUpFlowAction, setFollowUpFlowAction] = useState<Action | null>(
    null
  );
  const [schedulingActionId, setSchedulingActionId] = useState<string | null>(
    null
  );
  const [snoozeActionId, setSnoozeActionId] = useState<string | null>(null);
  const [noteActionId, setNoteActionId] = useState<string | null>(null);
  const [noteAction, setNoteAction] = useState<Action | null>(null);
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [preCallBriefs, setPreCallBriefs] = useState<PreCallBrief[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<PreCallBrief | null>(null);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [capacityOverride, setCapacityOverride] = useState<CapacityLevel | null>(null);
  const [capacityOverrideReason, setCapacityOverrideReason] = useState<string | null>(null);
  const [defaultCapacityOverride, setDefaultCapacityOverride] = useState<CapacityLevel | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  useEffect(() => {
    fetchSubscriptionStatus();
    fetchDailyPlan();
    fetchWeeklyFocus();
    fetchPreCallBriefs();
    fetchCapacityOverride();
    fetchFormattedDate();
  }, []);

  const fetchFormattedDate = async () => {
    try {
      // Fetch user's timezone from database
      const response = await fetch("/api/users/timezone");
      if (!response.ok) {
        throw new Error("Failed to fetch timezone");
      }
      const data = await response.json();
      const userTimezone = data.timezone || "America/New_York";

      // Format date using user's timezone (not browser timezone)
      const { formatInTimeZone } = await import("date-fns-tz");
      const now = new Date();
      const formatted = formatInTimeZone(now, userTimezone, "EEEE, MMMM d, yyyy");
      setFormattedDate(formatted);
    } catch (error) {
      console.error("Error fetching formatted date:", error);
      // Fallback to browser timezone if API fails
      setFormattedDate(
        new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
    }
  };

  const fetchCapacityOverride = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/plan/capacity-override?date=${today}`);
      if (response.ok) {
        const data = (await response.json()) as {
          dailyOverride?: CapacityLevel | null;
          dailyOverrideReason?: string | null;
          defaultOverride?: CapacityLevel | null;
        };
        setCapacityOverride(data.dailyOverride || null);
        setCapacityOverrideReason(data.dailyOverrideReason || null);
        setDefaultCapacityOverride(data.defaultOverride || null);
      }
    } catch (err) {
      console.error("Failed to fetch capacity override:", err);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/billing/subscription");
      if (!response.ok) {
        // If no subscription, that's okay - user will see paywall
        setSubscriptionStatus("none");
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse subscription response as JSON:", jsonError);
        setSubscriptionStatus("none");
        return;
      }
      setSubscriptionStatus(data.status || "none");
      setIsReadOnly(data.isReadOnly || false);
      setTrialEndsAt(data.trialEndsAt ? new Date(data.trialEndsAt) : null);
      setIsPremium(data.plan === "premium" || false);

      // Show paywall if no access or payment issue
      if (
        data.status === "none" ||
        data.status === "canceled" ||
        data.status === "past_due" ||
        data.isReadOnly
      ) {
        setShowPaywall(true);
      }
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      // Default to showing paywall on error
      setShowPaywall(true);
    }
  };

  const fetchDailyPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/daily-plans?date=${today}`);

      if (!response.ok) {
        if (response.status === 404) {
          // No plan exists yet - this is okay, not an error
          setDailyPlan(null);
          setLoading(false);
          return;
        }
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          errorData = {};
        }
        throw new Error(errorData.error || "Failed to fetch daily plan");
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse daily plan response as JSON:", jsonError);
        throw new Error("Failed to fetch daily plan");
      }
      setDailyPlan(data.dailyPlan || null);
    } catch (err) {
      console.error("Error fetching daily plan:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load daily plan"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyFocus = async () => {
    try {
      // Fetch most recent weekly summary
      const response = await fetch("/api/weekly-summaries?limit=1");
      
      if (response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error("Failed to parse weekly focus response as JSON:", jsonError);
          setWeeklyFocus("Build consistent revenue rhythm");
          return;
        }
        // The API returns { summary: {...}, summaries: [...] }
        // summary is the most recent one
        if (data?.summary?.next_week_focus) {
          setWeeklyFocus(data.summary.next_week_focus);
          return;
        }
        // Fallback: check summaries array
        if (data?.summaries?.[0]?.next_week_focus) {
          setWeeklyFocus(data.summaries[0].next_week_focus);
          return;
        }
      }
      
      // Fallback: placeholder if no weekly summary exists
      setWeeklyFocus("Build consistent revenue rhythm");
    } catch (err) {
      console.error("Failed to fetch weekly focus:", err);
      // Fallback on error
      setWeeklyFocus("Build consistent revenue rhythm");
    }
  };

  const fetchPreCallBriefs = async () => {
    try {
      const response = await fetch("/api/pre-call-briefs");
      if (!response.ok) {
        // If upgrade required or other error, just don't show briefs
        if (response.status === 402) {
          // Premium feature - silently skip
          return;
        }
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse pre-call briefs response as JSON:", jsonError);
        return;
      }

      if (data.success && data.briefs) {
        // Transform briefs to match our type
        const briefs: PreCallBrief[] = data.briefs.map((b: {
          id?: string;
          calendarEventId: string;
          eventTitle: string;
          eventStart: string;
          personPinId?: string | null;
          leadId?: string | null;
          personName?: string | null;
          briefContent: string;
          lastInteractionDate?: string | null;
          followUpCount?: number;
          nextStepSuggestions?: string[];
          userNotes?: string | null;
          hasVideoConference?: boolean;
        }) => ({
          id: b.id,
          calendarEventId: b.calendarEventId,
          eventTitle: b.eventTitle,
          eventStart: new Date(b.eventStart),
          personPinId: b.personPinId,
          personName: b.personName,
          briefContent: b.briefContent,
          lastInteractionDate: b.lastInteractionDate ? new Date(b.lastInteractionDate) : null,
          followUpCount: b.followUpCount || 0,
          nextStepSuggestions: b.nextStepSuggestions || [],
          userNotes: b.userNotes,
          hasVideoConference: b.hasVideoConference || false,
        }));
        setPreCallBriefs(briefs);
      }
    } catch (err) {
      console.error("Failed to fetch pre-call briefs:", err);
      // Silently fail - briefs are optional
    }
  };

  const handleGeneratePlan = async () => {
    try {
      setLoading(true);
      setError(null);
      // Don't send date - let server calculate it from user's timezone
      // This prevents timezone mismatches
      const response = await fetch("/api/daily-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // Empty body - server will calculate date from user's timezone
      });

      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          throw new Error("Failed to generate plan");
        }
        throw new Error(data.error || "Failed to generate plan");
      }

      const data = await response.json();
      
      // Track daily plan generation
      const { trackDailyPlanGenerated } = await import("@/lib/analytics/posthog");
      trackDailyPlanGenerated({
        planId: data.plan?.id,
        actionCount: data.plan?.action_count || 0,
        fastWinIncluded: !!data.plan?.fast_win,
        capacityLevel: data.plan?.capacity || "default",
      });

      // Refresh to show the new plan
      await fetchDailyPlan();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate plan");
      setLoading(false);
    }
  };

  const handleActionComplete = async (
    actionId: string,
    completionType?: string
  ) => {
    try {
      const state = completionType === "sent" ? "SENT" : "DONE";
      
      // Find the action to get its type and check if it's a Fast Win
      const allActions = [
        ...(dailyPlan?.fast_win ? [dailyPlan.fast_win] : []),
        ...(dailyPlan?.actions || []),
      ];
      const action = allActions.find((a) => a.id === actionId);
      const isFastWin = action?.action_type === "FAST_WIN";
      
      const response = await fetch(`/api/actions/${actionId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });

      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          throw new Error("Failed to complete action");
        }
        throw new Error(data.error || "Failed to complete action");
      }

      // Track action completion
      const { trackActionCompleted, trackFastWinCompleted } = await import("@/lib/analytics/posthog");
      if (isFastWin) {
        trackFastWinCompleted({
          actionId,
          actionType: action?.action_type,
        });
      } else {
        trackActionCompleted({
          actionId,
          actionType: action?.action_type,
          actionState: state,
        });
      }

      // Refresh the plan to update progress
      await fetchDailyPlan();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to complete action");
    }
  };

  const handleSetPromise = async (
    actionId: string,
    promisedDueAt: string | null
  ) => {
    try {
      const response = await fetch(`/api/actions/${actionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promised_due_at: promisedDueAt }),
      });

      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          throw new Error("Failed to update promise");
        }
        throw new Error(data.error || "Failed to update promise");
      }

      // Refresh the plan to update the action
      await fetchDailyPlan();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update promise");
    }
  };

  const handleGotReply = async (actionId: string) => {
    const allActions = [
      ...(dailyPlan?.fast_win ? [dailyPlan.fast_win] : []),
      ...(dailyPlan?.actions || []),
    ];
    const action = allActions.find((a) => a.id === actionId);
    if (action) {
      // Track "Got Reply" event
      const { trackGotReply } = await import("@/lib/analytics/posthog");
      trackGotReply({
        actionId,
        actionType: action.action_type,
      });
      setFollowUpFlowAction(action);
    }
  };

  const handleSnooze = async (actionId: string, snoozeUntil: string) => {
    try {
      const response = await fetch(`/api/actions/${actionId}/snooze`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snooze_until: snoozeUntil }),
      });

      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          throw new Error("Failed to snooze action");
        }
        throw new Error(data.error || "Failed to snooze action");
      }

      setSnoozeActionId(null);
      await fetchDailyPlan();
    } catch (err) {
      throw err;
    }
  };

  const handleAddNote = (actionId: string) => {
    const allActions = [
      ...(dailyPlan?.fast_win ? [dailyPlan.fast_win] : []),
      ...(dailyPlan?.actions || []),
    ];
    const action = allActions.find((a) => a.id === actionId);
    if (action) {
      setNoteAction(action);
      setNoteActionId(actionId);
    }
  };

  const handleSaveNote = async (actionId: string, note: string) => {
    try {
      const response = await fetch(`/api/actions/${actionId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });

      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          throw new Error("Failed to save note");
        }
        throw new Error(data.error || "Failed to save note");
      }

      await fetchDailyPlan();
    } catch (err) {
      throw err;
    }
  };

  const handleScheduleFollowUp = async (
    actionId: string,
    followUpDate: string,
    note?: string
  ) => {
    try {
      const stateResponse = await fetch(`/api/actions/${actionId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "REPLIED" }),
      });

      if (!stateResponse.ok) {
        let data;
        try {
          data = await stateResponse.json();
        } catch (jsonError) {
          console.error("Failed to parse state response as JSON:", jsonError);
          throw new Error("Failed to schedule follow-up");
        }
        throw new Error(data.error || "Failed to mark action as replied");
      }

      const scheduledDate = new Date(followUpDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      let noteWithDate = note ? `${note}\n\n` : "";
      noteWithDate += `Follow-up scheduled for ${scheduledDate}`;

      const noteResponse = await fetch(`/api/actions/${actionId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteWithDate }),
      });

      if (!noteResponse.ok) {
        console.warn("Failed to add note, but action was updated");
      }

      setSchedulingActionId(null);
      await fetchDailyPlan();
    } catch (err) {
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-600">Loading your plan...</p>
      </div>
    );
  }

  // Don't show full-screen error - show inline error instead (below)
  // Full-screen errors should only be for critical failures

  const actions = dailyPlan?.actions || [];
  const fastWin = dailyPlan?.fast_win;
  // Fast win is already excluded from actions array in API, but filter just to be safe
  let regularActions = actions.filter((a) => a.id !== fastWin?.id);
  
  // Filter by duration if selected
  if (selectedDuration !== null) {
    regularActions = regularActions.filter((action) => {
      if (!action.estimated_minutes) return false;
      return action.estimated_minutes <= selectedDuration;
    });
    // Also filter fast win if it doesn't match duration
    if (fastWin && fastWin.estimated_minutes && fastWin.estimated_minutes > selectedDuration) {
      // Don't show fast win if it exceeds selected duration
    }
  }

  // Include fast win in counts for progress calculation
  const allActionsInPlan = [...(fastWin ? [fastWin] : []), ...actions];
  const completedCount = allActionsInPlan.filter(
    (a) => a.state === "DONE" || a.state === "REPLIED" || a.state === "SENT"
  ).length;
  const totalCount = allActionsInPlan.length;

  // Calculate progress percentage
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <>
      {showPaywall && (
        <PaywallOverlay
          subscriptionStatus={subscriptionStatus}
          isReadOnly={isReadOnly}
          trialEndsAt={trialEndsAt ? trialEndsAt.toISOString() : null}
          onDismiss={() => setShowPaywall(false)}
        />
      )}
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              Your NextBestMove for Today
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              {formattedDate || "Loading..."}
            </p>
          </div>
          {dailyPlan && (
            <button
              onClick={handleGeneratePlan}
              disabled={loading}
              className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              {loading ? "Regenerating..." : "Regenerate Plan"}
            </button>
          )}
        </div>

        {/* Daily Capacity Card */}
        {dailyPlan && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="space-y-4">
              {/* Determine effective capacity: manual override OR actual capacity used (includes adaptive recovery) */}
              {(() => {
                const effectiveCapacity = capacityOverride || (dailyPlan.capacity !== "default" ? dailyPlan.capacity : null);
                return (
                  <CapacityOverrideControl
                    date={new Date().toISOString().split("T")[0]}
                    currentOverride={effectiveCapacity}
                    currentOverrideReason={capacityOverrideReason}
                    onOverrideChange={() => {
                      fetchCapacityOverride();
                      // Optionally regenerate plan when override changes
                      // handleGeneratePlan();
                    }}
                    showLabel={true}
                    compact={false}
                  />
                );
              })()}
              
              {/* Show capacity details - different messages for Auto vs Adaptive Recovery vs Manual Override */}
              {(() => {
                // If there's a manual override, show override message
                if (capacityOverride) {
                  return (
                    <div className="rounded-lg bg-zinc-50 p-3 text-sm">
                      <p className="text-zinc-700">
                        <span className="font-medium">
                          {capacityOverride === "micro" && "Busy Day"}
                          {capacityOverride === "light" && "Light Day"}
                          {capacityOverride === "standard" && "Standard"}
                          {capacityOverride === "heavy" && "Heavy Day"}
                        </span>{" "}
                        capacity is set at{" "}
                        <span className="font-semibold">
                          {totalCount} task{totalCount !== 1 ? "s" : ""}
                        </span>
                        {capacityOverrideReason && (
                          <span className="text-zinc-500"> ({capacityOverrideReason})</span>
                        )}
                      </p>
                    </div>
                  );
                }
                
                // If adaptive recovery was applied (capacity is micro/light but no manual override and not user default)
                // We know it's adaptive recovery if:
                // - dailyPlan.capacity is micro/light
                // - No manual override (capacityOverride is null)
                // - Not user's default (defaultCapacityOverride !== dailyPlan.capacity)
                const isAdaptiveRecovery = 
                  (dailyPlan.capacity === "micro" || dailyPlan.capacity === "light") &&
                  !capacityOverride &&
                  defaultCapacityOverride !== dailyPlan.capacity;
                
                if (isAdaptiveRecovery) {
                  const isMicro = dailyPlan.capacity === "micro";
                  return (
                    <div className="rounded-lg bg-blue-50 p-3 text-sm">
                      <p className="text-blue-900">
                        <span className="font-medium">
                          {isMicro ? "Micro" : "Light"} capacity
                        </span>{" "}
                        ({totalCount} task{totalCount !== 1 ? "s" : ""}) - easing back into your routine
                      </p>
                    </div>
                  );
                }
                
                // If capacity is truly auto (from calendar or default)
                if (dailyPlan.capacity && dailyPlan.capacity !== "default") {
                  return (
                    <div className="rounded-lg bg-zinc-50 p-3 text-sm">
                      <p className="text-zinc-700">
                        <span className="font-medium">Auto Capacity</span> is set at{" "}
                        <span className="font-semibold">
                          {totalCount} task{totalCount !== 1 ? "s" : ""}
                        </span>{" "}
                        based on {dailyPlan.free_minutes || 0} minutes of availability today.
                      </p>
                    </div>
                  );
                }
                
                return null;
              })()}
              
              {/* Duration Filter */}
              <div className="border-t border-zinc-200 pt-4">
                <DurationSelector
                  selectedDuration={selectedDuration}
                  onDurationChange={setSelectedDuration}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Message (Inline) */}
        {error && (
          <div className={`rounded-lg border p-4 ${
            error.includes("aren't generated") || error.includes("Weekends")
              ? "border-blue-200 bg-blue-50"
              : "border-red-200 bg-red-50"
          }`}>
            <div className="flex items-start gap-3">
              <svg
                className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                  error.includes("aren't generated") || error.includes("Weekends")
                    ? "text-blue-600"
                    : "text-red-600"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {error.includes("aren't generated") || error.includes("Weekends") ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                )}
              </svg>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  error.includes("aren't generated") || error.includes("Weekends")
                    ? "text-blue-800"
                    : "text-red-800"
                }`}>
                  {error}
                </p>
                {error.includes("Settings") && (
                  <a
                    href="/app/settings"
                    className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                  >
                    Go to Settings →
                  </a>
                )}
                <button
                  onClick={() => setError(null)}
                  className={`mt-2 ml-4 text-sm ${
                    error.includes("aren't generated") || error.includes("Weekends")
                      ? "text-blue-600 hover:text-blue-800"
                      : "text-red-600 hover:text-red-800"
                  } underline`}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Celebration Banner */}
        <CelebrationBanner />

        {/* Weekly Focus Card or Adaptive Recovery Message */}
        {(dailyPlan?.focus_statement || weeklyFocus) && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
                  {dailyPlan?.focus_statement ? "Today's Focus" : "This Week's Focus"}
                </h2>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {dailyPlan?.focus_statement || weeklyFocus}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pre-Call Briefs Carousel */}
        {preCallBriefs.length > 0 && (
          <PreCallBriefCarousel
            briefs={preCallBriefs}
            isPremium={isPremium}
            onViewFull={(brief) => {
              if (isPremium) {
                setSelectedBrief(brief);
                setShowBriefModal(true);
              }
              // For Standard users, the upgrade is handled in PreCallBriefCard
            }}
          />
        )}

        {/* Progress Indicator */}
        {dailyPlan && totalCount > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-700">
                  Progress
                </span>
                {dailyPlan.capacity && dailyPlan.capacity !== "default" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {dailyPlan.capacity === "light" && "Light capacity"}
                    {dailyPlan.capacity === "micro" && "Micro capacity"}
                    {dailyPlan.capacity === "heavy" && "Heavy capacity"}
                    {dailyPlan.capacity === "standard" && "Calendar-based capacity"}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-zinc-900">
                {completedCount} of {totalCount} actions completed
              </span>
            </div>
            <div
              className="mt-2 h-2 w-full rounded-full bg-zinc-100 overflow-hidden"
              style={{ position: "relative" }}
            >
              <div
                style={{
                  width: `${Math.max(0, Math.min(100, progressPercentage))}%`,
                  height: "8px",
                  backgroundColor: "#9333ea",
                  transition: "width 0.3s ease",
                  borderRadius: "9999px",
                  minWidth: progressPercentage > 0 ? "4px" : "0",
                  display: "block",
                }}
                role="progressbar"
                aria-valuenow={completedCount}
                aria-valuemin={0}
                aria-valuemax={totalCount}
              >
                &nbsp;
              </div>
            </div>
          </div>
        )}

        {/* Fast Win Card */}
        {fastWin && (
          <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-900 shadow-sm">
                FAST WIN
              </span>
              <span className="rounded-full bg-purple-200 px-3 py-1 text-xs font-medium text-purple-800">
                Under 5 minutes
              </span>
            </div>
            <UnifiedActionCard
              action={fastWin}
              onComplete={handleActionComplete}
              onSnooze={(id) => setSnoozeActionId(id)}
              onAddNote={handleAddNote}
              onGotReply={handleGotReply}
              onSetPromise={handleSetPromise}
            />
          </div>
        )}

        {/* Regular Actions */}
        {regularActions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-zinc-900">
              Your Actions
            </h2>
            <div className="space-y-4">
              {regularActions.map((action) => (
                <UnifiedActionCard
                  key={action.id}
                  action={action}
                  onComplete={handleActionComplete}
                  onSnooze={(id) => setSnoozeActionId(id)}
                  onAddNote={handleAddNote}
                  onGotReply={handleGotReply}
                  onSetPromise={handleSetPromise}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!dailyPlan && (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
            <div className="mx-auto max-w-md">
              <svg
                className="mx-auto h-12 w-12 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                No plan for today
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                Your daily plan will appear here once it&apos;s generated. Check
                back later or generate a plan now.
              </p>
              <div className="mt-6 flex gap-3 justify-center">
                <button
                  onClick={fetchDailyPlan}
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Refresh
                </button>
                <button
                  onClick={handleGeneratePlan}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Generate Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {dailyPlan && (
          <div className="border-t border-zinc-200 pt-6 text-center">
            <p className="text-base text-zinc-600 italic">
              Stay consistent. Small actions move everything forward.
            </p>
          </div>
        )}

        {/* Modals */}
        <FollowUpFlowModal
          isOpen={followUpFlowAction !== null}
          onClose={() => setFollowUpFlowAction(null)}
          action={followUpFlowAction}
          onSchedule={() => {
            if (followUpFlowAction) {
              setSchedulingActionId(followUpFlowAction.id);
            }
          }}
          onSnooze={() => {
            if (followUpFlowAction) {
              setSnoozeActionId(followUpFlowAction.id);
              setFollowUpFlowAction(null);
            }
          }}
          onComplete={() => {
            if (followUpFlowAction) {
              handleActionComplete(followUpFlowAction.id);
              setFollowUpFlowAction(null);
            }
          }}
          onAddNote={() => {
            if (followUpFlowAction) {
              handleAddNote(followUpFlowAction.id);
              setFollowUpFlowAction(null);
            }
          }}
        />

        <FollowUpSchedulingModal
          isOpen={schedulingActionId !== null}
          onClose={() => setSchedulingActionId(null)}
          actionId={schedulingActionId}
          onSchedule={handleScheduleFollowUp}
        />

        <SnoozeActionModal
          isOpen={snoozeActionId !== null}
          onClose={() => setSnoozeActionId(null)}
          actionId={snoozeActionId}
          onSnooze={handleSnooze}
        />

        <ActionNoteModal
          isOpen={noteActionId !== null}
          onClose={() => {
            setNoteActionId(null);
            setNoteAction(null);
          }}
          actionId={noteActionId}
          existingNote={noteAction?.notes || null}
          onSave={handleSaveNote}
        />

        <PreCallBriefModal
          isOpen={showBriefModal}
          onClose={() => {
            setShowBriefModal(false);
            setSelectedBrief(null);
          }}
          brief={selectedBrief}
        />
      </div>
    </>
  );
}
