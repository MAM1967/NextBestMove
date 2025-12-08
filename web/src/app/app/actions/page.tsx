"use client";

import { useState, useEffect } from "react";
import { ActionCard } from "./ActionCard";
import { FollowUpSchedulingModal } from "./FollowUpSchedulingModal";
import { SnoozeActionModal } from "./SnoozeActionModal";
import { ActionNoteModal } from "./ActionNoteModal";
import { ViewPromptModal } from "./ViewPromptModal";
import { Action } from "./types";
import { ToastContainer, useToast, type Toast } from "@/components/ui/Toast";

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toasts, addToast, dismissToast } = useToast();

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

  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);
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
   */
  const handleGotReply = async (actionId: string) => {
    try {
      const action = actions.find((a) => a.id === actionId);
      if (!action) {
        throw new Error("Action not found");
      }

      // Check if there's already an active FOLLOW_UP action for this lead
      // Only block if there's a NEW or SNOOZED FOLLOW_UP (not DONE/REPLIED)
      if (action.person_id) {
        const existingFollowUp = actions.find(
          (a) =>
            a.person_id === action.person_id &&
            a.action_type === "FOLLOW_UP" &&
            (a.state === "NEW" || a.state === "SNOOZED") &&
            new Date(a.due_date) >= new Date() // Not overdue
        );

        if (existingFollowUp) {
          // Format the existing follow-up date for the message
          const existingDate = new Date(existingFollowUp.due_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          addToast({
            type: "info",
            message: `You already have a follow-up scheduled for ${existingDate}. Complete that one first, or edit its date if needed.`,
          });
          return;
        }
      }

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

  if (loading) {
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
    <div className="space-y-6 p-6">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Actions</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Manage your action items and follow-ups
          </p>
        </div>
        <button
          onClick={fetchActions}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Refresh
        </button>
      </div>

      {actions.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
          <p className="text-zinc-600">No actions found.</p>
          <p className="mt-2 text-sm text-zinc-500">
            Actions will appear here when you have tasks to complete.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onComplete={handleComplete}
              onSnooze={(id) => setSnoozeActionId(id)}
              onAddNote={handleAddNote}
              onGotReply={handleGotReply}
              onViewPrompt={(action) => setViewPromptAction(action)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {/* FollowUpFlowModal removed - FOLLOW_UP now auto-creates on "Got a reply" */}

      {/* Scheduling modal now used only for editing existing FOLLOW_UP dates */}
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

      <ViewPromptModal
        isOpen={viewPromptAction !== null}
        onClose={() => setViewPromptAction(null)}
        actionDescription={viewPromptAction?.description || null}
      />
    </div>
  );
}
