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

// Re-export for convenience (keeping PersonPin alias for backward compatibility during migration)
export type PersonPin = LeadBasic;

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
  leads?: PersonPin | null; // Supabase relation - renamed from person_pins
}







