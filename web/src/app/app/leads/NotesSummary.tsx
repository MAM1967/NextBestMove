"use client";

import { useEffect, useState } from "react";
import type { NotesSummary } from "@/lib/leads/notes-summary";
import {
  formatDateForSummary,
  getMomentumTrendLabel,
  getMomentumTrendColor,
} from "@/lib/leads/notes-summary";
import { formatDateForDisplay } from "@/lib/utils/dateUtils";

interface NotesSummaryProps {
  relationshipId: string;
  refreshTrigger?: number; // Increment this to trigger a refresh
}

export function NotesSummary({ relationshipId, refreshTrigger }: NotesSummaryProps) {
  const [summary, setSummary] = useState<NotesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async (isUpdate = false) => {
    if (isUpdate) {
      setUpdating(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await fetch(`/api/leads/${relationshipId}/notes-summary`);
      if (!response.ok) {
        throw new Error("Failed to load notes summary");
      }
      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load summary");
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (relationshipId) {
      fetchSummary();
    }
  }, [relationshipId]);

  // Auto-refresh when refreshTrigger changes (e.g., after notes are saved)
  useEffect(() => {
    if (relationshipId && refreshTrigger && refreshTrigger > 0) {
      // Small delay to allow database to update
      const timeoutId = setTimeout(() => {
        fetchSummary(true);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [relationshipId, refreshTrigger]);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900">Notes Summary</h3>
        <div className="text-sm text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900">Notes Summary</h3>
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900">Notes Summary</h3>
        {updating && (
          <span className="text-xs text-zinc-500 italic">Updating...</span>
        )}
      </div>

      <div className="space-y-6">
        {/* Interaction Metrics */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-zinc-700">Interactions</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">Total:</span>
              <span className="ml-2 font-medium text-zinc-900">{summary.totalInteractions}</span>
            </div>
            <div>
              <span className="text-zinc-500">Last 30 days:</span>
              <span className="ml-2 font-medium text-zinc-900">{summary.recentInteractions}</span>
            </div>
            <div className="col-span-2">
              <span className="text-zinc-500">Last interaction:</span>
              <span className="ml-2 font-medium text-zinc-900">
                {formatDateForSummary(summary.lastInteractionDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-zinc-700">Action Items</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Pending:</span>
              <span className="font-medium text-zinc-900">{summary.pendingActionsCount}</span>
            </div>
            {summary.overdueActionsCount > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Overdue:</span>
                <span className="font-medium text-red-600">{summary.overdueActionsCount}</span>
              </div>
            )}
            {summary.postCallActionsCount > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Post-call:</span>
                <span className="font-medium text-zinc-900">{summary.postCallActionsCount}</span>
              </div>
            )}
          </div>

          {/* Top Pending Actions */}
          {summary.pendingActions.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs font-medium text-zinc-500">Top pending:</div>
              {summary.pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs"
                >
                  <div className="font-medium text-zinc-900">
                    {action.description || `${action.type} action`}
                  </div>
                  <div className="mt-1 text-zinc-500">
                    Due: {formatDateForDisplay(action.dueDate)}
                    {summary.overdueActionsCount > 0 &&
                      new Date(action.dueDate) < new Date() && (
                        <span className="ml-2 text-red-600">(Overdue)</span>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Post-Call Actions */}
          {summary.postCallActions.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs font-medium text-zinc-500">Post-call items:</div>
              {summary.postCallActions.map((action) => (
                <div
                  key={action.id}
                  className="rounded-md border border-blue-200 bg-blue-50 p-2 text-xs"
                >
                  <div className="font-medium text-zinc-900">
                    {action.description || "Post-call action"}
                  </div>
                  <div className="mt-1 text-zinc-500">
                    Due: {formatDateForDisplay(action.dueDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Momentum Snapshot */}
        <div>
          <h4 className="mb-2 text-sm font-medium text-zinc-700">Momentum</h4>
          <div className="space-y-2 text-sm">
            {summary.momentum.score !== null && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Score:</span>
                <span className="font-medium text-zinc-900">{summary.momentum.score}/100</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Trend:</span>
              <span
                className={`font-medium ${getMomentumTrendColor(summary.momentum.trend)}`}
              >
                {getMomentumTrendLabel(summary.momentum.trend)}
              </span>
            </div>
            {summary.momentum.daysSinceLastInteraction !== null && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Days since last:</span>
                <span className="font-medium text-zinc-900">
                  {summary.momentum.daysSinceLastInteraction}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Next Follow-Up */}
        {summary.nextFollowUpDate && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-zinc-700">Next Follow-Up</h4>
            <div className="text-sm">
              <span className="text-zinc-500">Suggested:</span>
              <span className="ml-2 font-medium text-zinc-900">
                {formatDateForDisplay(summary.nextFollowUpDate.split("T")[0])}
              </span>
            </div>
          </div>
        )}

        {/* Research Topics */}
        {summary.researchTopics.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-zinc-700">Research Topics</h4>
            <div className="flex flex-wrap gap-2">
              {summary.researchTopics.map((topic, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




