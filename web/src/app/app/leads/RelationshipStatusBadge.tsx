"use client";

import type { RelationshipStatusInput, RelationshipStatus } from "@/lib/leads/relationship-status";
import {
  computeRelationshipStatus,
  getStatusLabel,
  getStatusBadgeClasses,
} from "@/lib/leads/relationship-status";

interface RelationshipStatusBadgeProps {
  cadence: RelationshipStatusInput["cadence"];
  tier: RelationshipStatusInput["tier"];
  last_interaction_at: RelationshipStatusInput["last_interaction_at"];
  next_touch_due_at: RelationshipStatusInput["next_touch_due_at"];
  cadence_days: RelationshipStatusInput["cadence_days"];
  overdue_actions_count?: RelationshipStatusInput["overdue_actions_count"];
  className?: string;
}

export function RelationshipStatusBadge({
  cadence,
  tier,
  last_interaction_at,
  next_touch_due_at,
  cadence_days,
  overdue_actions_count = 0,
  className = "",
}: RelationshipStatusBadgeProps) {
  const status: RelationshipStatus = computeRelationshipStatus({
    cadence,
    tier,
    last_interaction_at,
    next_touch_due_at,
    cadence_days,
    overdue_actions_count,
  });

  const label = getStatusLabel(status);
  const badgeClasses = getStatusBadgeClasses(status);

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${badgeClasses} ${className}`}
      title={`Relationship status: ${label}`}
    >
      {label}
    </span>
  );
}





