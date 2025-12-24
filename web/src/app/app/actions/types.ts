export type ActionType =
  | "OUTREACH"
  | "FOLLOW_UP"
  | "NURTURE"
  | "CALL_PREP"
  | "POST_CALL"
  | "CONTENT"
  | "FAST_WIN";

export type ActionState =
  | "NEW"
  | "SENT"
  | "REPLIED"
  | "SNOOZED"
  | "DONE"
  | "ARCHIVED";

import type { LeadBasic } from "@/lib/leads/types";

// Re-export for convenience
export type PersonPin = LeadBasic; // @deprecated Use LeadBasic instead

export interface Action {
  id: string;
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
  leads?: LeadBasic | null; // Supabase relation to leads table
  
  // Decision engine fields (optional, will be populated once backend is implemented)
  lane?: "priority" | "in_motion" | "on_deck" | null;
  next_move_score?: number | null;
  
  // Promised follow-up
  promised_due_at?: string | null;
  
  // Estimated duration for "I have X minutes" feature
  estimated_minutes?: number | null;
}







