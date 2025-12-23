"use client";

import { useState, useEffect } from "react";
import { ActionListRow } from "./ActionListRow";
import { FollowUpSchedulingModal } from "./FollowUpSchedulingModal";
import { SnoozeActionModal } from "./SnoozeActionModal";
import { ActionNoteModal } from "./ActionNoteModal";
import { ViewPromptModal } from "./ViewPromptModal";
import { Action } from "./types";
import { ToastContainer, useToast, type Toast } from "@/components/ui/Toast";
import { getDaysDifference } from "@/lib/utils/dateUtils";
import { useActionsByLane } from "@/lib/decision-engine/hooks";
import type { ActionWithLane } from "@/lib/decision-engine/types";

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toasts, addToast, dismissToast } = useToast();
  // Track which actions are currently being processed to prevent duplicate requests (race condition protection)
  const [processingReply, setProcessingReply] = useState<Set<string>>(new Set());

  // Modal states (keeping for snooze/complete flows, but removing follow-up modal)
  const [snoozeActionId, setSnoozeActionId] = useState<string | null>(null);
  const [noteActionId, setNoteActionId] = useState<string | null>(null);
  const [noteAction, setNoteAction] = useState<Action | null>(null);
  const [viewPromptAction, setViewPromptAction] = useState<Action | null>(null);
  // Keep scheduling modal for editing follow-up date if user clicks "Adjust"
  const [schedulingActionId, setSchedulingActionId] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchActions();
  }, []);

  // Fetch actions using decision engine lanes
  const { actions: actionsByLane, loading: lanesLoading, error: lanesError } = useActionsByLane();
  
  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use decision engine API
      const laneResponse = await fetch("/api/decision-engine/actions-by-lane");
      if (laneResponse.ok) {
        const laneData = await laneResponse.json();
        // Combine all lanes into a single array for compatibility
        const allLaneActions: Action[] = [
          ...(laneData.priority || []),
          ...(laneData.in_motion || []),
          ...(laneData.on_deck || []),
        ];
        // Map ActionWithLane to Action format
        const mappedActions: Action[] = allLaneActions.map((a: any) => ({
          ...a,
          lane: a.lane || null,
          next_move_score: a.next_move_score || null,
        }));
        setActions(mappedActions);
        setLoading(false);
        return;
      }
      
      // Fallback to legacy API if decision engine not ready
      const response = await fetch("/api/actions");
      if (!response.ok) {
        throw new Error("Failed to fetch actions");
      }
      const data = await response.json();
      // Show all actions including completed ones (for consistency with plan page)
      // Filter out only ARCHIVED actions (they can be shown later with filters)
      // Completed actions (DONE, SENT, REPLIED) will show with badges
      const visibleActions = (data.actions || []).filter(
        (action: Action) => action.state !== "ARCHIVED"
      );
      console.log("Fetched actions:", visibleActions.length, "actions");
      console.log(
        "Action states:",
        visibleActions.map((a: Action) => ({ id: a.id, state: a.state }))
      );
      setActions(visibleActions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load actions");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (actionId: string, completionType?: string) => {
    try {
      const state = completionType === "sent" ? "SENT" : "DONE";
      console.log("Completing action:", actionId, "with state:", state);

      const response = await fetch(`/api/actions/${actionId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Failed to complete action:", data);
        throw new Error(data.error || "Failed to complete action");
      }

      const result = await response.json();
      console.log("Action completed successfully:", result);
      console.log("Updated action state:", result.action?.state);

      await fetchActions();
    } catch (err) {
      console.error("Error completing action:", err);
      alert(err instanceof Error ? err.message : "Failed to complete action");
    }
  };

  /**
   * Calculate smart default follow-up date
   * Standard: 2-3 days out
   * Future enhancement: Adjust based on lead engagement history
   */
  const calculateFollowUpDate = (): string => {
    const daysOut = 2; // Standard default (can be enhanced later)
    const date = new Date();
    date.setDate(date.getDate() + daysOut);
    return date.toISOString().split("T")[0]; // YYYY-MM-DD format
  };

  /**
   * Auto-create FOLLOW_UP action when user marks "Got a reply"
   * Zero-friction: No modal, no decisions - just create and notify
   * 
   * Protection against duplicates:
   * 1. Client-side: Processing lock prevents double-clicks/race conditions
   * 2. Server-side: Database query in API endpoint prevents duplicates
   */
  const handleGotReply = async (actionId: string) => {
    // Prevent duplicate requests (race condition protection)
    if (processingReply.has(actionId)) {
      console.log("Already processing reply for action:", actionId);
      return;
    }

    try {
      // Mark as processing immediately to prevent double-clicks/race conditions
      setProcessingReply((prev) => new Set(prev).add(actionId));

      const action = actions.find((a) => a.id === actionId);
      if (!action) {
        throw new Error("Action not found");
      }

      // Note: We rely on server-side check (in API endpoint) as the source of truth
      // The server queries the database atomically, so duplicates are prevented
      // Client-side check is removed to avoid race conditions with stale data

      // First, mark the current action as REPLIED
      const stateResponse = await fetch(`/api/actions/${actionId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "REPLIED" }),
      });

      if (!stateResponse.ok) {
        const data = await stateResponse.json();
        throw new Error(data.error || "Failed to mark action as replied");
      }

      // Calculate follow-up date
      const followUpDate = calculateFollowUpDate();
      const followUpDateFormatted = new Date(followUpDate).toLocaleDateString(
        "en-US",
        {
          month: "long",
          day: "numeric",
          year: "numeric",
        }
      );

      // Create FOLLOW_UP action automatically
      const createResponse = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_type: "FOLLOW_UP",
          person_id: action.person_id || null,
          due_date: followUpDate,
          description: action.leads?.name
            ? `Follow up with ${action.leads.name}`
            : "Follow up on recent reply",
          notes: `Auto-created after reply on ${new Date().toLocaleDateString()}`,
          auto_created: true,
        }),
      });

      if (!createResponse.ok) {
        const data = await createResponse.json();
        // If server says there's already a follow-up, show helpful message
        if (data.error && data.error.includes("already have a follow-up")) {
          addToast({
            type: "info",
            message: data.error,
          });
          return; // Don't throw error, just show the message
        }
        throw new Error(data.error || "Failed to create follow-up action");
      }

      const { action: newFollowUpAction } = await createResponse.json();

      // Show toast notification with edit option
      addToast({
        type: "success",
        message: `Follow-up scheduled for ${followUpDateFormatted}.`,
        action: {
          label: "Adjust",
          onClick: () => {
            // Open scheduling modal to edit the follow-up date
            if (newFollowUpAction) {
              setSchedulingActionId(newFollowUpAction.id);
            }
          },
        },
      });

      // Refresh actions to show the new FOLLOW_UP
      await fetchActions();
    } catch (err) {
      console.error("Error handling got reply:", err);
      addToast({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to create follow-up",
      });
    } finally {
      // Always clear processing flag
      setProcessingReply((prev) => {
        const next = new Set(prev);
        next.delete(actionId);
        return next;
      });
    }
  };

  /**
   * Handle scheduling/editing follow-up date
   * This is now used for editing an already-created FOLLOW_UP action
   */
  const handleScheduleFollowUp = async (
    actionId: string,
    followUpDate: string,
    note?: string
  ) => {
    try {
      // This endpoint is now used for editing an existing FOLLOW_UP action
      // Update the due date and notes
      const updateResponse = await fetch(`/api/actions/${actionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          due_date: followUpDate,
          notes: note || undefined, // Only update if note provided
        }),
      });

      if (!updateResponse.ok) {
        const data = await updateResponse.json();
        throw new Error(data.error || "Failed to update follow-up");
      }

      const scheduledDate = new Date(followUpDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      addToast({
        type: "success",
        message: `Follow-up date updated to ${scheduledDate}.`,
      });

      // Close the scheduling modal
      setSchedulingActionId(null);

      await fetchActions();
    } catch (err) {
      console.error("Error updating follow-up:", err);
      addToast({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to update follow-up",
      });
      throw err;
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
        const data = await response.json();
        throw new Error(data.error || "Failed to snooze action");
      }

      // Close the snooze modal
      setSnoozeActionId(null);

      await fetchActions();
    } catch (err) {
      throw err;
    }
  };

  const handleAddNote = (actionId: string) => {
    const action = actions.find((a) => a.id === actionId);
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
        const data = await response.json();
        throw new Error(data.error || "Failed to save note");
      }

      await fetchActions();
    } catch (err) {
      throw err;
    }
  };

  /**
   * Bucket actions using decision engine lanes if available, otherwise use legacy heuristics
   */
  const bucketActions = (allActions: Action[]) => {
    // If we have lane data from decision engine, use it
    if (actionsByLane) {
      return {
        needsAttentionNow: actionsByLane.priority || [],
        conversationsInMotion: actionsByLane.in_motion || [],
        stayTopOfMind: [], // Can be populated from on_deck if needed
        optionalBackground: actionsByLane.on_deck || [],
      };
    }

    // Legacy fallback: use heuristics based on existing fields
    const needsAttentionNow: Action[] = [];
    const conversationsInMotion: Action[] = [];
    const stayTopOfMind: Action[] = [];
    const optionalBackground: Action[] = [];
    const assigned = new Set<string>();

    const mark = (bucket: Action[], action: Action) => {
      bucket.push(action);
      assigned.add(action.id);
    };

    // Determine buckets using simple heuristics based on existing fields
    allActions.forEach((action) => {
      if (action.state === "ARCHIVED") {
        return;
      }

      // If action has a lane, use it directly
      if (action.lane === "priority") {
        mark(needsAttentionNow, action);
        return;
      } else if (action.lane === "in_motion") {
        mark(conversationsInMotion, action);
        return;
      } else if (action.lane === "on_deck") {
        // Split on_deck into "Stay top of mind" (NURTURE) and "Optional/background" (everything else)
        if (action.action_type === "NURTURE") {
          mark(stayTopOfMind, action);
        } else {
          mark(optionalBackground, action);
        }
        return;
      }

      // Legacy heuristics for actions without lanes
      const daysDiff = getDaysDifference(action.due_date); // >0 overdue, 0 today, <0 future
      const isCompleted =
        action.state === "DONE" ||
        action.state === "REPLIED" ||
        action.state === "SENT";

      // 1) Needs attention now: overdue or due today and not completed
      if (!isCompleted && daysDiff >= 0) {
        mark(needsAttentionNow, action);
        return;
      }

      // 2) Conversations in motion: follow-ups and recently replied actions
      if (
        action.action_type === "FOLLOW_UP" ||
        action.state === "REPLIED"
      ) {
        mark(conversationsInMotion, action);
        return;
      }

      // 3) Stay top of mind: nurture/check-in type actions
      if (action.action_type === "NURTURE") {
        mark(stayTopOfMind, action);
        return;
      }
    });

    // 4) Optional / background: everything else not yet assigned
    allActions.forEach((action) => {
      if (!assigned.has(action.id) && action.state !== "ARCHIVED") {
        optionalBackground.push(action);
      }
    });

    return {
      needsAttentionNow,
      conversationsInMotion,
      stayTopOfMind,
      optionalBackground,
    };
  };

  if (loading || lanesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-600">Loading actions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchActions}
            className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    needsAttentionNow,
    conversationsInMotion,
    stayTopOfMind,
    optionalBackground,
  } = bucketActions(actions);

  return (
    <>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Toast notifications */}
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Actions</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Focus on the first section. Everything else can wait.
              </p>
            </div>
            <button
              onClick={fetchActions}
              className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              Refresh
            </button>
          </div>

          {actions.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
              <p className="text-zinc-600">No actions found.</p>
              <p className="mt-2 text-sm text-zinc-500">
                Actions will appear here when you have tasks to complete.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Section 1: Needs attention now */}
              <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                  Needs attention now
                </h2>
                <p className="mt-1 text-xs text-rose-800">
                  Overdue items, due today, and reply‑needed actions. Start
                  here.
                </p>
                {needsAttentionNow.length === 0 ? (
                  <p className="mt-3 text-xs text-rose-700">
                    Nothing urgent right now.
                  </p>
                ) : (
                  <div className="mt-3 space-y-1.5">
                    {needsAttentionNow.map((action) => (
                      <ActionListRow
                        key={action.id}
                        action={action}
                        variant="urgent"
                        onComplete={handleComplete}
                        onSnooze={(id) => setSnoozeActionId(id)}
                        onAddNote={handleAddNote}
                        onGotReply={handleGotReply}
                        onViewPrompt={(action) => setViewPromptAction(action)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Section 2: Conversations in motion */}
              <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700">
                  Conversations in motion
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Follow‑ups and active threads that are already moving.
                </p>
                {conversationsInMotion.length === 0 ? (
                  <p className="mt-3 text-xs text-zinc-500">
                    No active conversations right now.
                  </p>
                ) : (
                  <div className="mt-3 space-y-1.5">
                    {conversationsInMotion.map((action) => (
                      <ActionListRow
                        key={action.id}
                        action={action}
                        variant="motion"
                        onComplete={handleComplete}
                        onSnooze={(id) => setSnoozeActionId(id)}
                        onAddNote={handleAddNote}
                        onGotReply={handleGotReply}
                        onViewPrompt={(action) => setViewPromptAction(action)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Section 3: Stay top of mind */}
              <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700">
                  Stay top of mind
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Low‑frequency touches to keep relationships warm.
                </p>
                {stayTopOfMind.length === 0 ? (
                  <p className="mt-3 text-xs text-zinc-500">
                    No nurture actions right now.
                  </p>
                ) : (
                  <div className="mt-3 space-y-1.5">
                    {stayTopOfMind.map((action) => (
                      <ActionListRow
                        key={action.id}
                        action={action}
                        variant="nurture"
                        onComplete={handleComplete}
                        onSnooze={(id) => setSnoozeActionId(id)}
                        onAddNote={handleAddNote}
                        onGotReply={handleGotReply}
                        onViewPrompt={(action) => setViewPromptAction(action)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Section 4: Optional / background */}
              <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700">
                  Optional / background
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Content and non‑time‑sensitive actions that are nice to do.
                </p>
                {optionalBackground.length === 0 ? (
                  <p className="mt-3 text-xs text-zinc-500">
                    No optional actions right now.
                  </p>
                ) : (
                  <div className="mt-3 space-y-1.5">
                    {optionalBackground.map((action) => (
                      <ActionListRow
                        key={action.id}
                        action={action}
                        variant="optional"
                        onComplete={handleComplete}
                        onSnooze={(id) => setSnoozeActionId(id)}
                        onAddNote={handleAddNote}
                        onGotReply={handleGotReply}
                        onViewPrompt={(action) => setViewPromptAction(action)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {/* FOLLOW_UP now auto-creates on "Got a reply" - no dedicated flow modal */}

      {/* Scheduling modal (edit existing FOLLOW_UP dates) */}
      <FollowUpSchedulingModal
        isOpen={schedulingActionId !== null}
        onClose={() => setSchedulingActionId(null)}
        actionId={schedulingActionId}
        onSchedule={handleScheduleFollowUp}
      />

      {/* Snooze modal */}
      <SnoozeActionModal
        isOpen={snoozeActionId !== null}
        onClose={() => setSnoozeActionId(null)}
        actionId={snoozeActionId}
        onSnooze={handleSnooze}
      />

      {/* Notes modal */}
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

      {/* Prompt helper modal */}
      <ViewPromptModal
        isOpen={viewPromptAction !== null}
        onClose={() => setViewPromptAction(null)}
        actionDescription={viewPromptAction?.description || null}
      />
    </>
  );
}
