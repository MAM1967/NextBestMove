/**
 * Notes Summary types and utilities
 * 
 * Types for relationship Notes Summary aggregates
 */

export interface NotesSummary {
  relationshipId: string;
  relationshipName: string;
  // Interaction metrics
  totalInteractions: number;
  recentInteractions: number;
  lastInteractionDate: string | null;
  // Action items
  pendingActionsCount: number;
  overdueActionsCount: number;
  postCallActionsCount: number;
  pendingActions: PendingAction[];
  postCallActions: PostCallAction[];
  // Research topics
  researchTopics: string[];
  // Momentum
  momentum: MomentumSnapshot;
  // Next follow-up
  nextFollowUpDate: string | null;
  // Suggested next action
  suggestedNextAction: string | null;
}

export interface PendingAction {
  id: string;
  type: string;
  description: string | null;
  dueDate: string;
  state: string;
}

export interface PostCallAction {
  id: string;
  description: string | null;
  dueDate: string;
}

export interface MomentumSnapshot {
  score: number | null;
  trend: "increasing" | "stable" | "declining" | "unknown";
  recentActivity: number;
  daysSinceLastInteraction: number | null;
}

/**
 * Format date for display
 */
export function formatDateForSummary(dateString: string | null): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Get momentum trend label
 */
export function getMomentumTrendLabel(trend: string): string {
  switch (trend) {
    case "increasing":
      return "Increasing";
    case "stable":
      return "Stable";
    case "declining":
      return "Declining";
    default:
      return "Unknown";
  }
}

/**
 * Get momentum trend color
 */
export function getMomentumTrendColor(trend: string): string {
  switch (trend) {
    case "increasing":
      return "text-green-600";
    case "stable":
      return "text-zinc-600";
    case "declining":
      return "text-red-600";
    default:
      return "text-zinc-400";
  }
}

