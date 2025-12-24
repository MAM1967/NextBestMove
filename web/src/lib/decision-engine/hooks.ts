/**
 * Decision Engine Hooks
 * 
 * React hooks for fetching decision engine data.
 * These hooks assume the backend decision engine APIs are available.
 */

import { useState, useEffect } from "react";
import type { BestActionResponse, ActionWithLane } from "./types";

/**
 * Hook to fetch the best action for Today
 * 
 * @param durationMinutes - Optional duration filter (5, 10, or 15 minutes)
 */
export function useBestAction(durationMinutes?: number | null) {
  const [bestAction, setBestAction] = useState<BestActionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBestAction() {
      try {
        setLoading(true);
        setError(null);
        const url = durationMinutes
          ? `/api/decision-engine/best-action?duration=${durationMinutes}`
          : "/api/decision-engine/best-action";
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch best action");
        }
        const data = await response.json();
        setBestAction(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load best action");
        setBestAction(null);
      } finally {
        setLoading(false);
      }
    }

    fetchBestAction();
  }, [durationMinutes]);

  return { bestAction, loading, error, refetch: () => {
    // Trigger re-fetch by updating a dummy state
    setBestAction(null);
    setLoading(true);
  }};
}

/**
 * Hook to fetch actions grouped by lane
 */
export function useActionsByLane(lane?: "priority" | "in_motion" | "on_deck") {
  const [actions, setActions] = useState<{
    priority: ActionWithLane[];
    in_motion: ActionWithLane[];
    on_deck: ActionWithLane[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActions() {
      try {
        setLoading(true);
        setError(null);
        const url = lane
          ? `/api/decision-engine/actions-by-lane?lane=${lane}`
          : "/api/decision-engine/actions-by-lane";
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch actions by lane");
        }
        const data = await response.json();
        
        // If filtering by specific lane, normalize to full structure
        if (lane) {
          setActions({
            priority: [],
            in_motion: [],
            on_deck: [],
            [lane]: data[lane] || [],
          });
        } else {
          setActions({
            priority: data.priority || [],
            in_motion: data.in_motion || [],
            on_deck: data.on_deck || [],
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load actions");
        setActions(null);
      } finally {
        setLoading(false);
      }
    }

    fetchActions();
  }, [lane]);

  return { actions, loading, error, refetch: () => {
    setActions(null);
    setLoading(true);
  }};
}

