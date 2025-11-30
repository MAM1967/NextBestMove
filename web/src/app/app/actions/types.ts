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

export interface PersonPin {
  id: string;
  name: string;
  url: string;
  notes?: string | null;
}

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
  person_pins?: PersonPin | null;
}



