import type { SupabaseClient } from "@supabase/supabase-js";

export interface ActionHistoryItem {
  event: string;
  timestamp: string;
  state?: string;
}

export interface RelatedAction {
  id: string;
  action_type: string;
  state: string;
  due_date: string;
  description: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ActionDetails {
  action: any;
  history: ActionHistoryItem[];
  relatedActions: RelatedAction[];
}

/**
 * Derive action history from timestamps
 */
export function deriveActionHistory(action: {
  created_at: string | null;
  updated_at: string | null;
  completed_at: string | null;
  state: string;
}): ActionHistoryItem[] {
  const history: ActionHistoryItem[] = [];

  // Created event
  if (action.created_at) {
    history.push({
      event: "Created",
      timestamp: action.created_at,
      state: action.state,
    });
  }

  // State changes (we infer from updated_at and completed_at)
  if (action.updated_at && action.updated_at !== action.created_at) {
    // If state is not NEW and updated_at differs from created_at, there was a state change
    if (action.state !== "NEW") {
      history.push({
        event: `State changed to ${action.state}`,
        timestamp: action.updated_at,
        state: action.state,
      });
    }
  }

  // Completed event
  if (action.completed_at) {
    history.push({
      event: "Completed",
      timestamp: action.completed_at,
      state: action.state,
    });
  }

  // Sort history by timestamp
  history.sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return history;
}

/**
 * Fetch related actions for the same lead
 */
export async function fetchRelatedActions(
  supabase: SupabaseClient,
  userId: string,
  actionId: string,
  personId: string | null
): Promise<RelatedAction[]> {
  if (!personId) {
    return [];
  }

  const { data: related, error: relatedError } = await supabase
    .from("actions")
    .select("id, action_type, state, due_date, description, created_at, completed_at")
    .eq("user_id", userId)
    .eq("person_id", personId)
    .neq("id", actionId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (relatedError || !related) {
    return [];
  }

  return related as RelatedAction[];
}

/**
 * Get detailed action information including lead relationship, history, and related actions
 * 
 * This is the core business logic extracted from the API route handler.
 * Can be tested directly with a Supabase client (service role or user context).
 */
export async function getActionDetails(
  supabase: SupabaseClient,
  userId: string,
  actionId: string
): Promise<ActionDetails | null> {
  // Fetch action with lead relationship
  const { data: action, error: actionError } = await supabase
    .from("actions")
    .select(
      `
      *,
      leads (
        id,
        name,
        url,
        notes,
        status
      )
    `
    )
    .eq("id", actionId)
    .eq("user_id", userId)
    .single();

  if (actionError || !action) {
    return null;
  }

  // Derive action history from timestamps
  const history = deriveActionHistory({
    created_at: action.created_at,
    updated_at: action.updated_at,
    completed_at: action.completed_at,
    state: action.state,
  });

  // Fetch related actions for same lead (if action has a person_id)
  const relatedActions = await fetchRelatedActions(
    supabase,
    userId,
    actionId,
    action.person_id
  );

  return {
    action: {
      ...action,
      history,
      relatedActions,
    },
    history,
    relatedActions,
  } as ActionDetails;
}

