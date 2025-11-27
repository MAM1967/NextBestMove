"use client";

import { useState, useEffect } from "react";
import { ActionCard } from "./ActionCard";
import { FollowUpFlowModal } from "./FollowUpFlowModal";
import { FollowUpSchedulingModal } from "./FollowUpSchedulingModal";
import { SnoozeActionModal } from "./SnoozeActionModal";
import { ActionNoteModal } from "./ActionNoteModal";
import { ViewPromptModal } from "./ViewPromptModal";
import { Action } from "./types";

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [viewPromptAction, setViewPromptAction] = useState<Action | null>(null);

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
      console.log("Action states:", visibleActions.map((a: Action) => ({ id: a.id, state: a.state })));
      setActions(visibleActions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load actions"
      );
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

  const handleGotReply = (actionId: string) => {
    const action = actions.find((a) => a.id === actionId);
    if (action) {
      setFollowUpFlowAction(action);
    }
  };

  const handleScheduleFollowUp = async (
    actionId: string,
    followUpDate: string,
    note?: string
  ) => {
    try {
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

      // Format the scheduled date for display
      const scheduledDate = new Date(followUpDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      // Build note with scheduled date
      let noteWithDate = note ? `${note}\n\n` : "";
      noteWithDate += `Follow-up scheduled for ${scheduledDate}`;

      // Add note with scheduled date
      const noteResponse = await fetch(`/api/actions/${actionId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteWithDate }),
      });

      if (!noteResponse.ok) {
        console.warn("Failed to add note, but action was updated");
      }

      // TODO: Create a new FOLLOW_UP action for the scheduled date
      // This will be implemented when we have the action creation API
      console.log(
        `TODO: Create FOLLOW_UP action for ${followUpDate} based on action ${actionId}`
      );

      // Close the scheduling modal
      setSchedulingActionId(null);
      
      await fetchActions();
    } catch (err) {
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
            handleComplete(followUpFlowAction.id);
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

      <ViewPromptModal
        isOpen={viewPromptAction !== null}
        onClose={() => setViewPromptAction(null)}
        actionDescription={viewPromptAction?.description || null}
      />
    </div>
  );
}

