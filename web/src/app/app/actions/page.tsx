"use client";

import { useState, useEffect } from "react";
import { UnifiedActionCard } from "../components/UnifiedActionCard";
import { FollowUpSchedulingModal } from "./FollowUpSchedulingModal";
import { SnoozeActionModal } from "./SnoozeActionModal";
import { ActionNoteModal } from "./ActionNoteModal";
import { ViewPromptModal } from "./ViewPromptModal";
import { EstimatedMinutesModal } from "./EstimatedMinutesModal";
import { ActionDetailModal } from "./ActionDetailModal";
import { Action } from "./types";
import { ToastContainer, useToast, type Toast } from "@/components/ui/Toast";
import { getDaysDifference } from "@/lib/utils/dateUtils";
import { useActionsByLane } from "@/lib/decision-engine/hooks";
import type { ActionWithLane } from "@/lib/decision-engine/types";
import { ChannelNudgesList } from "../components/ChannelNudgeCard";
import { ActionsFilterBar } from "./ActionsFilterBar";
import { ActionsList } from "./ActionsList";
import type { ActionStatus } from "@/lib/actions/status-mapping";
import type { ActionSource, ActionIntentType } from "./types";

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
  const [promiseActionId, setPromiseActionId] = useState<string | null>(null);
  const [estimatedMinutesActionId, setEstimatedMinutesActionId] = useState<string | null>(null);
  const [detailActionId, setDetailActionId] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<{
    view: 'due' | 'relationships';
    relationshipId: string | null;
    dueFilter: 'overdue' | 'today' | 'next_7_days' | 'this_month' | 'none' | 'all';
    status: ActionStatus[];
    source: ActionSource[];
    intentType: ActionIntentType[];
  }>({
    view: 'due',
    relationshipId: null,
    dueFilter: 'all',
    status: ['pending', 'waiting'],
    source: [],
    intentType: [],
  });

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

  const handleSetEstimatedMinutes = async (actionId: string, minutes: number | null) => {
    try {
      const response = await fetch(`/api/actions/${actionId}/estimated-minutes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimated_minutes: minutes }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update time estimate");
      }

      await fetchActions();
    } catch (err) {
      throw err;
    }
  };

  const handleSetPromise = async (actionId: string, promisedDueAt: string | null) => {
    try {
      const response = await fetch(`/api/actions/${actionId}/promise`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promised_due_at: promisedDueAt }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update promise");
      }

      await fetchActions();
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update promise",
      });
    }
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
                {filters.view === 'due' 
                  ? 'Process follow-ups and keep relationships moving.'
                  : 'View actions grouped by relationship.'}
              </p>
            </div>
            <button
              onClick={fetchActions}
              className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              Refresh
            </button>
          </div>

          {/* Filter Bar */}
          <ActionsFilterBar onFilterChange={setFilters} />

          {/* Channel Nudges - Stalled conversations */}
          <ChannelNudgesList />

          {/* Actions List */}
          <ActionsList
            view={filters.view}
            actions={actions}
            filters={filters}
            onComplete={handleComplete}
            onSnooze={(id) => setSnoozeActionId(id)}
            onAddNote={handleAddNote}
            onGotReply={handleGotReply}
            onViewPrompt={(action) => setViewPromptAction(action)}
            onClick={(action) => setDetailActionId(action.id)}
            onSetPromise={handleSetPromise}
            onSetEstimatedMinutes={(id) => setEstimatedMinutesActionId(id)}
          />
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

      {/* Estimated minutes modal */}
      {estimatedMinutesActionId && (
        <EstimatedMinutesModal
          actionId={estimatedMinutesActionId}
          currentMinutes={
            actions.find((a) => a.id === estimatedMinutesActionId)?.estimated_minutes || null
          }
          isOpen={estimatedMinutesActionId !== null}
          onClose={() => setEstimatedMinutesActionId(null)}
          onSave={async (minutes) => {
            await handleSetEstimatedMinutes(estimatedMinutesActionId, minutes);
          }}
        />
      )}

      {/* Action detail modal */}
      <ActionDetailModal
        isOpen={detailActionId !== null}
        onClose={() => setDetailActionId(null)}
        actionId={detailActionId}
        onActionClick={(id) => {
          setDetailActionId(id);
        }}
      />
    </>
  );
}
