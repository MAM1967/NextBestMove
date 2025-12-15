"use client";

import { Action } from "./types";
import {
  getDaysDifference,
  formatDateForDisplay,
} from "@/lib/utils/dateUtils";

interface ActionListRowProps {
  action: Action;
  onComplete: (actionId: string, completionType?: string) => void;
  onSnooze: (actionId: string) => void;
  onAddNote: (actionId: string) => void;
  onGotReply?: (actionId: string) => void;
  onViewPrompt?: (action: Action) => void;
}

function getVerbForAction(action: Action): string {
  switch (action.action_type) {
    case "OUTREACH":
      return "Start conversation";
    case "FOLLOW_UP":
      return "Advance conversation";
    case "NURTURE":
      return "Stay top of mind";
    case "CONTENT":
      return "Add value";
    case "CALL_PREP":
      return "Prepare call";
    case "POST_CALL":
      return "Close the loop";
    case "FAST_WIN":
      return "Take a fast win";
    default:
      return "Take action";
  }
}

function getPersonName(action: Action): string | null {
  return action.leads?.name || null;
}

function getContext(action: Action): string | null {
  if (action.description) return action.description;
  if (action.notes) return action.notes;
  return null;
}

function getDueStatusLabel(action: Action): string {
  // Completed states
  if (action.state === "DONE") return "Completed";
  if (action.state === "REPLIED") return "Replied";
  if (action.state === "SENT") return "Sent";
  if (action.state === "SNOOZED") {
    return action.snooze_until
      ? `Snoozed until ${formatDateForDisplay(action.snooze_until)}`
      : "Snoozed";
  }

  const diff = getDaysDifference(action.due_date);

  if (diff > 0) {
    // overdue by diff days
    return `Overdue ${diff}d`;
  }

  if (diff === 0) {
    return "Due today";
  }

  // Future: show due in N days or date
  const daysAhead = Math.abs(diff);
  if (daysAhead === 1) {
    return "Due tomorrow";
  }

  if (daysAhead <= 7) {
    return `Due ${formatDateForDisplay(action.due_date)}`;
  }

  return `Due ${formatDateForDisplay(action.due_date, true)}`;
}

function getDueStatusClass(action: Action): string {
  if (action.state === "DONE") return "text-emerald-600";
  if (action.state === "REPLIED") return "text-blue-600";
  if (action.state === "SENT") return "text-zinc-500";
  if (action.state === "SNOOZED") return "text-zinc-500 italic";

  const diff = getDaysDifference(action.due_date);
  if (diff > 0) {
    // overdue
    return "text-red-600";
  }
  if (diff === 0) {
    return "text-amber-600";
  }
  // future
  return "text-zinc-500";
}

export function ActionListRow({
  action,
  onComplete,
  onSnooze,
  onAddNote,
  onGotReply,
  onViewPrompt,
}: ActionListRowProps) {
  const verb = getVerbForAction(action);
  const personName = getPersonName(action);
  const context = getContext(action);

  const primaryTextParts = [verb];
  if (personName) {
    primaryTextParts.push(`· ${personName}`);
  }
  if (context) {
    primaryTextParts.push(` — ${context}`);
  }

  const primaryText = primaryTextParts.join("");
  const dueLabel = getDueStatusLabel(action);
  const dueClass = getDueStatusClass(action);

  const isCompleted =
    action.state === "DONE" ||
    action.state === "REPLIED" ||
    action.state === "SENT";

  const handlePrimaryComplete = () => {
    if (action.action_type === "FOLLOW_UP" && onGotReply) {
      // Treat primary action for follow-ups as "Got reply"
      onGotReply(action.id);
    } else {
      onComplete(action.id);
    }
  };

  return (
    <div className="rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-zinc-200 hover:bg-zinc-50">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">
            <span
              className={`font-semibold ${
                isCompleted ? "text-zinc-500 line-through" : "text-zinc-900"
              }`}
            >
              {verb}
            </span>
            {personName && (
              <span
                className={`${
                  isCompleted ? "text-zinc-400 line-through" : "text-zinc-900"
                }`}
              >
                {" "}
                · {personName}
              </span>
            )}
            {context && !isCompleted && (
              <span className="text-zinc-500"> — {context}</span>
            )}
          </p>
        </div>
        <div
          className={`shrink-0 rounded-full bg-zinc-50 px-2 py-0.5 text-xs font-medium ${dueClass}`}
        >
          {dueLabel}
        </div>
      </div>

      {/* Lightweight actions – text buttons to keep cognitive load low */}
      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        {!isCompleted && (
          <>
            <button
              type="button"
              onClick={handlePrimaryComplete}
              className="font-medium text-zinc-900 hover:underline"
            >
              {action.action_type === "FOLLOW_UP" ? "Got reply" : "Mark done"}
            </button>
            <button
              type="button"
              onClick={() => onSnooze(action.id)}
              className="hover:underline"
            >
              Snooze
            </button>
          </>
        )}

        {action.action_type === "CONTENT" && onViewPrompt && (
          <button
            type="button"
            onClick={() => onViewPrompt(action)}
            className="hover:underline"
          >
            View prompt
          </button>
        )}

        <button
          type="button"
          onClick={() => onAddNote(action.id)}
          className="hover:underline"
        >
          Add note
        </button>
      </div>
    </div>
  );
}


