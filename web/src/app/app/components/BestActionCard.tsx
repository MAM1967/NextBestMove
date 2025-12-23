"use client";

import Link from "next/link";
import type { ActionWithLane } from "@/lib/decision-engine/types";

interface BestActionCardProps {
  action: ActionWithLane | null;
  loading?: boolean;
  reason?: string;
}

/**
 * BestActionCard component
 * 
 * Displays the single "Best Action" prominently at the top of Today page.
 * This is the highest-scoring action from Priority or In Motion lanes.
 */
export function BestActionCard({ action, loading, reason }: BestActionCardProps) {
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
    return null; // Don't show anything if no best action
  }

  const leadName = action.leads?.name || "Unknown";
  const actionDescription = action.description || `${action.action_type} ${leadName}`;

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

  return (
    <div className="bg-gradient-to-br from-rose-50 to-orange-50 border-2 border-rose-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-rose-900 uppercase tracking-wide">
              Best Action
            </span>
            {action.lane && (
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                  laneColors[action.lane] || "bg-gray-100 text-gray-800"
                }`}
              >
                {laneLabels[action.lane] || action.lane}
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
            <div className="text-2xl font-bold text-rose-600">
              {Math.round(action.next_move_score)}
            </div>
            <div className="text-xs text-gray-500">Score</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-rose-200">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="font-medium">{action.action_type.replace(/_/g, " ")}</span>
          <span>•</span>
          <span>{dueDateLabel}</span>
        </div>
        <Link
          href="/app/plan"
          className="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-md hover:bg-rose-700 transition-colors"
        >
          View Plan →
        </Link>
      </div>

      {reason && (
        <p className="mt-3 text-xs text-gray-500 italic">{reason}</p>
      )}
    </div>
  );
}

