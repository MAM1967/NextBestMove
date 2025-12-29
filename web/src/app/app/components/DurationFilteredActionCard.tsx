"use client";

import Link from "next/link";
import type { ActionWithLane } from "@/lib/decision-engine/types";
import { formatPromiseDate, isPromiseOverdue } from "@/lib/utils/promiseUtils";

interface DurationFilteredActionCardProps {
  action: ActionWithLane | null;
  duration: number;
  loading?: boolean;
}

/**
 * DurationFilteredActionCard component
 * 
 * Displays a single action filtered by duration when user selects "I have X minutes".
 * Shows similar information to BestActionCard but with duration context.
 */
export function DurationFilteredActionCard({
  action,
  duration,
  loading,
}: DurationFilteredActionCardProps) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!action) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-4">
          <p className="text-sm font-medium text-zinc-900 mb-2">
            No actions fit in {duration} minutes
          </p>
          <p className="text-xs text-zinc-600 mb-4">
            Try selecting a longer duration (10 or 15 minutes), set time estimates
            on your actions, or check back later when new actions are added.
          </p>
        </div>
      </div>
    );
  }

  const leadName = action.leads?.name || "Unknown";
  const actionDescription = action.description || `${action.action_type} ${leadName}`;

  // Check for promise
  const hasPromise = !!action.promised_due_at;
  const promiseOverdue = hasPromise && isPromiseOverdue(action.promised_due_at);

  // Format due date
  const dueDate = new Date(action.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateOnly = new Date(dueDate);
  dueDateOnly.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.floor((dueDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let dueDateLabel = "";
  if (daysUntilDue < 0) {
    dueDateLabel = `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? "s" : ""} overdue`;
  } else if (daysUntilDue === 0) {
    dueDateLabel = "Due today";
  } else if (daysUntilDue === 1) {
    dueDateLabel = "Due tomorrow";
  } else {
    dueDateLabel = `Due in ${daysUntilDue} days`;
  }

  // Lane badge color
  const laneColors = {
    priority: "bg-rose-100 text-rose-800 border-rose-200",
    in_motion: "bg-green-100 text-green-800 border-green-200",
    on_deck: "bg-blue-100 text-blue-800 border-blue-200",
  };

  const laneLabels = {
    priority: "Priority",
    in_motion: "In Motion",
    on_deck: "On Deck",
  };

  const estimatedMinutes = action.estimated_minutes || null;

  return (
    <div className={`bg-gradient-to-br border-2 rounded-lg p-6 shadow-sm ${
      promiseOverdue
        ? "from-red-50 to-red-100 border-red-400"
        : hasPromise
        ? "from-blue-50 to-blue-100 border-blue-300"
        : "from-purple-50 to-purple-100 border-purple-200"
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm font-semibold text-purple-900 uppercase tracking-wide">
              Best {duration}-Minute Action
            </span>
            {hasPromise && (
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  promiseOverdue
                    ? "bg-red-600 text-white"
                    : "bg-blue-500 text-white"
                }`}
                title={formatPromiseDate(action.promised_due_at!)}
              >
                {promiseOverdue ? "⚠️ Overdue Promise" : "✓ Promised"}
              </span>
            )}
            {action.lane && (
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                  laneColors[action.lane] || "bg-gray-100 text-gray-800"
                }`}
              >
                {laneLabels[action.lane] || action.lane}
              </span>
            )}
            {estimatedMinutes !== null && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                ~{estimatedMinutes} min
              </span>
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {actionDescription}
          </h3>
          {action.leads && (
            <p className="text-sm text-gray-600">
              {leadName}
            </p>
          )}
        </div>
        {action.next_move_score !== null && action.next_move_score !== undefined && (
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(action.next_move_score)}
            </div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-purple-200">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">{action.action_type.replace(/_/g, " ")}</span>
            <span>•</span>
            <span>{dueDateLabel}</span>
          </div>
          {hasPromise && (
            <div className={`text-xs font-medium ${
              promiseOverdue ? "text-red-700" : "text-blue-700"
            }`}>
              {formatPromiseDate(action.promised_due_at!)}
            </div>
          )}
        </div>
        <Link
          href="/app/plan"
          className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
        >
          View Plan →
        </Link>
      </div>

      <p className="mt-3 text-xs text-gray-500 italic">
        Best {duration}-minute action from {action.lane === "priority" ? "Priority" : action.lane === "in_motion" ? "In Motion" : "On Deck"} lane
      </p>
    </div>
  );
}





