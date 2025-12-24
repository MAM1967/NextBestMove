"use client";

import { useState, useEffect } from "react";
import { DurationFilteredActionCard } from "./DurationFilteredActionCard";
import { useActionsByLane } from "@/lib/decision-engine/hooks";
import { getActionForDuration } from "@/lib/decision-engine/duration-filter";
import type { ActionWithLane } from "@/lib/decision-engine/types";

interface DurationFilteredActionCardClientProps {
  duration: number;
}

/**
 * Client wrapper for DurationFilteredActionCard that fetches and filters data
 */
export function DurationFilteredActionCardClient({
  duration,
}: DurationFilteredActionCardClientProps) {
  const { actions, loading, error } = useActionsByLane();
  const [filteredAction, setFilteredAction] = useState<ActionWithLane | null>(null);

  useEffect(() => {
    if (actions && !loading && !error) {
      // Combine all lanes into a single array
      const allActions: ActionWithLane[] = [
        ...(actions.priority || []),
        ...(actions.in_motion || []),
        ...(actions.on_deck || []),
      ];

      // Filter to get best action for duration
      const bestAction = getActionForDuration(allActions, duration);
      setFilteredAction(bestAction);
    } else {
      setFilteredAction(null);
    }
  }, [actions, loading, error, duration]);

  // Don't show anything if there's an error (backend not ready)
  if (error) {
    return null;
  }

  return (
    <DurationFilteredActionCard
      action={filteredAction}
      duration={duration}
      loading={loading}
    />
  );
}

