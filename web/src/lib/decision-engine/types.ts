/**
 * Decision Engine Types
 * 
 * These types define the data structures for the Priority / In Motion / On Deck
 * decision engine system as described in Decision_Engine_Implementation_Spec.md
 */

import type { ActionType, ActionState } from "@/app/app/actions/types";

export type ActionLane = "priority" | "in_motion" | "on_deck";

export type MomentumTrend = "increasing" | "stable" | "declining" | "unknown";

export interface RelationshipDecisionState {
  relationship_id: string;
  lane: ActionLane;
  next_move_action_id?: string | null;
  next_move_score?: number | null;
  next_move_reason?: string | null;
  confidence?: "high" | "medium" | "low";
  
  // Precomputed state fields
  days_since_last_interaction?: number;
  pending_actions_count?: number;
  overdue_actions_count?: number;
  awaiting_response?: boolean;
  earliest_relevant_insight_date?: string | null;
  cadence_days?: number;
  momentum_score?: number;
  momentum_trend?: MomentumTrend;
}

export interface ActionWithLane {
  id: string;
  lane: ActionLane | null;
  next_move_score: number | null;
  
  // Standard action fields (from Action type)
  user_id: string;
  person_id?: string | null;
  action_type: ActionType;
  state: ActionState;
  description?: string | null;
  due_date: string;
  completed_at?: string | null;
  snooze_until?: string | null;
  notes?: string | null;
  auto_created: boolean;
  created_at: string;
  updated_at: string;
  leads?: {
    id: string;
    name: string;
    url: string;
    notes?: string | null;
  } | null;
  
  // Decision engine scoring breakdown (for tooltips/explanation)
  score_breakdown?: {
    urgency: number;
    stall_risk: number;
    value: number;
    effort_bias: number;
    total: number;
  };
}

export interface BestActionResponse {
  action: ActionWithLane | null;
  reason?: string;
  score?: number;
}

