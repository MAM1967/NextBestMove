"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Lead } from "@/lib/leads/types";
import { formatDistanceToNow } from "date-fns";

interface OverdueRelationship {
  lead: Lead;
  overdueActionsCount: number;
  daysSinceLastInteraction: number | null;
  nextTouchOverdue: boolean;
}

export function GlobalRollup() {
  const [overdueRelationships, setOverdueRelationships] = useState<
    OverdueRelationship[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverdueRelationships = async () => {
      try {
        const response = await fetch("/api/leads/overdue");
        if (!response.ok) {
          throw new Error("Failed to fetch overdue relationships");
        }
        const data = await response.json();
        setOverdueRelationships(data.relationships || []);
      } catch (err) {
        console.error("Error fetching overdue relationships:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverdueRelationships();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-sm text-zinc-600">Loading...</p>
      </div>
    );
  }

  if (overdueRelationships.length === 0) {
    return null; // Don't show if no overdue relationships
  }

  return (
    <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-orange-900">
          ⚠️ Top Overdue Relationships
        </h3>
        <Link
          href="/app/leads"
          className="text-xs font-medium text-orange-700 hover:text-orange-900 hover:underline"
        >
          View all →
        </Link>
      </div>
      <div className="space-y-2">
        {overdueRelationships.slice(0, 5).map((item) => {
          const reasons: string[] = [];
          if (item.overdueActionsCount > 0) {
            reasons.push(
              `${item.overdueActionsCount} overdue action${item.overdueActionsCount > 1 ? "s" : ""}`
            );
          }
          if (item.nextTouchOverdue) {
            reasons.push("touch due date passed");
          }
          if (item.daysSinceLastInteraction !== null && item.daysSinceLastInteraction > 90) {
            reasons.push(`${item.daysSinceLastInteraction} days since last interaction`);
          }

          return (
            <Link
              key={item.lead.id}
              href={`/app/leads/${item.lead.id}`}
              className="block rounded-md bg-white p-3 transition-colors hover:bg-orange-100"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-zinc-900 truncate">
                    {item.lead.name}
                  </div>
                  <div className="mt-1 text-xs text-zinc-600">
                    {reasons.join(" • ")}
                  </div>
                </div>
                {item.lead.next_touch_due_at && item.nextTouchOverdue && (
                  <div className="shrink-0 text-xs font-medium text-orange-700">
                    {formatDistanceToNow(new Date(item.lead.next_touch_due_at), {
                      addSuffix: true,
                    })}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}






