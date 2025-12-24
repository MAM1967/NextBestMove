"use client";

import { BestActionCard } from "./BestActionCard";
import { useBestAction } from "@/lib/decision-engine/hooks";

/**
 * Client wrapper for BestActionCard that fetches data
 * 
 * @param durationMinutes - Optional duration filter (5, 10, or 15 minutes)
 */
export function BestActionCardClient({ 
  durationMinutes 
}: { 
  durationMinutes?: number | null 
} = {}) {
  const { bestAction, loading, error } = useBestAction(durationMinutes);

  // Don't show anything if there's an error (backend not ready)
  if (error || !bestAction?.action) {
    return null;
  }

  return (
    <BestActionCard
      action={bestAction.action}
      loading={loading}
      reason={bestAction.reason}
    />
  );
}

