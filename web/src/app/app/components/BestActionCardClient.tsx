"use client";

import { BestActionCard } from "./BestActionCard";
import { useBestAction } from "@/lib/decision-engine/hooks";

/**
 * Client wrapper for BestActionCard that fetches data
 */
export function BestActionCardClient() {
  const { bestAction, loading, error } = useBestAction();

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

