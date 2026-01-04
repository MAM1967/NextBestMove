"use client";

import type { RelationshipSummary } from "@/lib/leads/summary-types";
import type { Action } from "@/app/app/actions/types";
import { formatDistanceToNow, format } from "date-fns";

interface NotesSummaryProps {
  summary: RelationshipSummary;
}

function formatRelativeDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateString;
  }
}

function formatActionDescription(action: Action): string {
  if (action.description) {
    return action.description;
  }
  return `${action.action_type.replace(/_/g, " ")} - Due ${format(new Date(action.due_date), "MMM d")}`;
}

export function NotesSummary({ summary }: NotesSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900">Notes Summary</h2>
        <p className="mt-1 text-sm text-zinc-600">
          At-a-glance overview of interactions and key information
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Total Interactions */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-sm font-medium text-zinc-600">Interactions (30 days)</div>
          <div className="mt-1 text-2xl font-bold text-zinc-900">
            {summary.totalInteractions30Days}
          </div>
        </div>

        {/* Last Interaction */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-sm font-medium text-zinc-600">Last Interaction</div>
          <div className="mt-1 text-lg font-semibold text-zinc-900">
            {summary.lastInteractionAt
              ? formatRelativeDate(summary.lastInteractionAt)
              : "Never"}
          </div>
        </div>

        {/* Next Follow-up */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="text-sm font-medium text-zinc-600">Next Follow-up</div>
          <div className="mt-1 text-lg font-semibold text-zinc-900">
            {summary.nextTouchDueAt
              ? formatRelativeDate(summary.nextTouchDueAt)
              : "Not scheduled"}
          </div>
        </div>
      </div>

      {/* Momentum and Trend removed from UI per NEX-50 */}

      {/* Pending Actions */}
      {summary.pendingActions.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold text-zinc-900">
            Pending Actions ({summary.pendingActions.length})
          </h3>
          <ul className="space-y-2">
            {summary.pendingActions.slice(0, 5).map((action) => (
              <li
                key={action.id}
                className="flex items-start gap-2 rounded-md bg-zinc-50 p-2"
              >
                <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  {action.action_type.replace(/_/g, " ")}
                </span>
                <span className="text-sm text-zinc-700">
                  {formatActionDescription(action)}
                </span>
                <span className="ml-auto text-xs text-zinc-500">
                  Due {format(new Date(action.due_date), "MMM d")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Post-Call Actions */}
      {summary.postCallActions.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold text-zinc-900">
            Post-Call Actions ({summary.postCallActions.length})
          </h3>
          <ul className="space-y-2">
            {summary.postCallActions.slice(0, 5).map((action) => (
              <li
                key={action.id}
                className="flex items-start gap-2 rounded-md bg-zinc-50 p-2"
              >
                <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                  {action.action_type.replace(/_/g, " ")}
                </span>
                <span className="text-sm text-zinc-700">
                  {formatActionDescription(action)}
                </span>
                <span className="ml-auto text-xs text-zinc-500">
                  Due {format(new Date(action.due_date), "MMM d")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Research Topics */}
      {summary.researchTopics.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold text-zinc-900">Key Topics</h3>
          <div className="flex flex-wrap gap-2">
            {summary.researchTopics.map((topic, index) => (
              <span
                key={index}
                className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {summary.totalInteractions30Days === 0 &&
        summary.pendingActions.length === 0 &&
        summary.postCallActions.length === 0 &&
        summary.researchTopics.length === 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
            <p className="text-zinc-600">
              No interaction data yet. Start engaging with this relationship to see
              summaries here.
            </p>
          </div>
        )}
    </div>
  );
}




