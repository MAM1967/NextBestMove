/**
 * Duration Filter Utilities
 * 
 * Functions for filtering actions by estimated duration.
 */

import type { ActionWithLane } from "./types";

/**
 * Get the best action for a given duration.
 * 
 * Filters actions by estimated_minutes <= duration, then sorts by:
 * 1. Lane priority (Priority > In Motion > On Deck)
 * 2. next_move_score (descending)
 * 
 * @param actions - Array of actions with lanes
 * @param duration - Maximum duration in minutes
 * @returns The best action that fits the duration, or null if none fit
 */
export function getActionForDuration(
  actions: ActionWithLane[],
  duration: number
): ActionWithLane | null {
  // Filter by duration - only include actions with estimated_minutes <= duration
  const filtered = actions.filter(
    (action) =>
      action.estimated_minutes !== null &&
      action.estimated_minutes !== undefined &&
      action.estimated_minutes <= duration
  );

  if (filtered.length === 0) {
    return null;
  }

  // Sort by lane priority, then by score
  const laneOrder: Record<string, number> = {
    priority: 0,
    in_motion: 1,
    on_deck: 2,
  };

  const sorted = filtered.sort((a, b) => {
    // First, sort by lane priority
    const laneA = a.lane || "on_deck";
    const laneB = b.lane || "on_deck";
    const laneDiff = (laneOrder[laneA] ?? 99) - (laneOrder[laneB] ?? 99);
    
    if (laneDiff !== 0) {
      return laneDiff;
    }

    // Then sort by score (descending)
    const scoreA = a.next_move_score ?? 0;
    const scoreB = b.next_move_score ?? 0;
    return scoreB - scoreA;
  });

  return sorted[0];
}




