"use client";

import { useState } from "react";
import { ActionCard } from "../actions/ActionCard";
import { SnoozeActionModal } from "../actions/SnoozeActionModal";
import { ActionNoteModal } from "../actions/ActionNoteModal";
import { useRouter } from "next/navigation";
import type { Action } from "../actions/types";

type StaleAction = Action & {
  days_old: number;
};

interface StaleActionsSectionProps {
  staleActions: StaleAction[];
}

export function StaleActionsSection({ staleActions }: StaleActionsSectionProps) {
  const router = useRouter();
  const [snoozeActionId, setSnoozeActionId] = useState<string | null>(null);
  const [noteActionId, setNoteActionId] = useState<string | null>(null);
  const [noteAction, setNoteAction] = useState<Action | null>(null);

  const handleActionComplete = async (actionId: string) => {
    // Refresh the page to update stale actions list
    router.refresh();
  };

  const handleSnooze = async (actionId: string, snoozeUntil: string) => {
    // The modal handles the actual snooze API call
    // We just need to refresh after it completes
    router.refresh();
  };

  const handleAddNote = (actionId: string) => {
    const action = staleActions.find((a) => a.id === actionId);
    if (action) {
      setNoteActionId(actionId);
      setNoteAction(action);
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

      setNoteActionId(null);
      setNoteAction(null);
      router.refresh();
    } catch (err) {
      throw err;
    }
  };

  if (staleActions.length === 0) {
    return (
      <div className="rounded-lg border border-green-100 bg-green-50 p-6 text-center">
        <svg
          className="mx-auto h-12 w-12 text-green-600"
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
        <h3 className="mt-4 text-sm font-semibold text-green-900">
          No stale actions
        </h3>
        <p className="mt-2 text-sm text-green-700">
          All your actions are being actively managed. Great job staying on top
          of things!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 shrink-0 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">
              {staleActions.length} action
              {staleActions.length > 1 ? "s" : ""} need attention
            </p>
            <p className="mt-1 text-xs text-amber-800">
              These actions were created but haven&apos;t been prioritized in
              your daily plans. Consider reviewing them to decide if they&apos;re
              still relevant, or snooze them if the timing isn&apos;t right.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {staleActions.map((action) => (
          <div
            key={action.id}
            className="rounded-lg border border-zinc-200 bg-white p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">
                  {action.days_old} day{action.days_old > 1 ? "s" : ""} old
                </span>
                <span className="text-xs text-zinc-400">•</span>
                <span className="text-xs text-zinc-500">
                  Created{" "}
                  {new Date(action.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
            <ActionCard
              action={action}
              onComplete={handleActionComplete}
              onSnooze={setSnoozeActionId}
              onAddNote={handleAddNote}
            />
          </div>
        ))}
      </div>

      {/* Modals */}
      <SnoozeActionModal
        isOpen={snoozeActionId !== null}
        actionId={snoozeActionId}
        onClose={() => setSnoozeActionId(null)}
        onSnooze={handleSnooze}
      />
      <ActionNoteModal
        isOpen={noteActionId !== null}
        actionId={noteActionId}
        existingNote={noteAction?.notes || null}
        onClose={() => {
          setNoteActionId(null);
          setNoteAction(null);
        }}
        onSave={handleSaveNote}
      />
    </div>
  );
}

