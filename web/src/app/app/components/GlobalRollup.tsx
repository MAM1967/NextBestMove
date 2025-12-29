"use client";

import { useEffect, useState } from "react";
import { formatDateForDisplay } from "@/lib/utils/dateUtils";
import Link from "next/link";

interface GlobalRollup {
  totalOverdueActions: number;
  totalOverdueRelationships: number;
  topOverdueActions: TopOverdueAction[];
  overdueRelationships: OverdueRelationship[];
}

interface TopOverdueAction {
  id: string;
  relationshipId: string | null;
  relationshipName: string;
  type: string;
  description: string;
  dueDate: string;
  state: string;
  lane: string | null;
  score: number | null;
}

interface OverdueRelationship {
  id: string;
  name: string;
  nextTouchDueAt: string;
  daysOverdue: number;
}

export function GlobalRollup() {
  const [rollup, setRollup] = useState<GlobalRollup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRollup = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/leads/notes-summary/global-rollup");
        if (!response.ok) {
          throw new Error("Failed to load global rollup");
        }
        const data = await response.json();
        setRollup(data.rollup);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load rollup");
      } finally {
        setLoading(false);
      }
    };

    fetchRollup();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900">Top Overdue Items</h3>
        <div className="text-sm text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900">Top Overdue Items</h3>
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (!rollup || (rollup.totalOverdueActions === 0 && rollup.totalOverdueRelationships === 0)) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900">Top Overdue Items</h3>
        <div className="text-sm text-zinc-500">No overdue items. Great job staying on top of things!</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-zinc-900">Top Overdue Items</h3>

      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 rounded-lg bg-zinc-50 p-3 text-sm">
          <div>
            <span className="text-zinc-500">Overdue actions:</span>
            <span className="ml-2 font-medium text-zinc-900">
              {rollup.totalOverdueActions}
            </span>
          </div>
          <div>
            <span className="text-zinc-500">Overdue relationships:</span>
            <span className="ml-2 font-medium text-zinc-900">
              {rollup.totalOverdueRelationships}
            </span>
          </div>
        </div>

        {/* Top Overdue Actions */}
        {rollup.topOverdueActions.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-zinc-700">Top Overdue Actions</h4>
            <div className="space-y-2">
              {rollup.topOverdueActions.map((action) => (
                <div
                  key={action.id}
                  className="rounded-md border border-red-200 bg-red-50 p-3 text-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-zinc-900">{action.description}</div>
                      <div className="mt-1 text-xs text-zinc-600">
                        {action.relationshipName}
                        {action.lane && (
                          <span className="ml-2 text-zinc-500">• {action.lane}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 text-right text-xs text-red-600">
                      Due: {formatDateForDisplay(action.dueDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overdue Relationships */}
        {rollup.overdueRelationships.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-zinc-700">Relationships Due for Touch</h4>
            <div className="space-y-2">
              {rollup.overdueRelationships.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/app/leads?edit=${rel.id}`}
                  className="block rounded-md border border-orange-200 bg-orange-50 p-3 text-sm transition-colors hover:bg-orange-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-zinc-900">{rel.name}</div>
                      <div className="mt-1 text-xs text-zinc-600">
                        Next touch was due {rel.daysOverdue} day{rel.daysOverdue > 1 ? "s" : ""} ago
                      </div>
                    </div>
                    <div className="ml-4 text-right text-xs text-orange-600">
                      {formatDateForDisplay(rel.nextTouchDueAt.split("T")[0])}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* View All Link */}
        <div className="pt-2 text-center">
          <Link
            href="/app/actions"
            className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline"
          >
            View all actions →
          </Link>
        </div>
      </div>
    </div>
  );
}





