import type { Action } from "@/app/app/actions/types";

/**
 * Relationship summary data types
 */

export interface RelationshipSummary {
  totalInteractions30Days: number;
  lastInteractionAt: string | null;
  nextTouchDueAt: string | null;
  pendingActions: Action[];
  postCallActions: Action[];
  researchTopics: string[];
  momentumScore: number | null;
  momentumTrend: "increasing" | "stable" | "declining" | "unknown";
}

export interface RelationshipSummaryResponse {
  summary: RelationshipSummary;
}





