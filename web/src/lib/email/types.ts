/**
 * Email metadata and connection types
 * Based on Nex-11 specifications
 */

export type EmailProvider = "gmail" | "outlook";

export type EmailConnectionStatus = "active" | "expired" | "error" | "disconnected";

export interface EmailConnection {
  id: string;
  user_id: string;
  provider: EmailProvider;
  status: EmailConnectionStatus;
  last_sync_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailMetadata {
  id: string;
  user_id: string;
  relationship_id: string | null;
  email_provider: EmailProvider;
  email_id: string;
  thread_id: string | null;
  from_address_hash: string;
  to_address_hash: string | null;
  subject: string | null;
  snippet: string | null;
  received_at: string;
  sent_at: string | null;
  labels: string[];
  topics: string[];
  asks: string[];
  open_loops: string[];
  is_read: boolean;
  is_replied: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type Sentiment = "positive" | "neutral" | "negative" | "urgent";
export type Intent = "question" | "request" | "follow_up" | "introduction" | "meeting_request" | "proposal" | "complaint" | "other";
export type ActionType = "OUTREACH" | "FOLLOW_UP" | "NURTURE" | "CALL_PREP" | "POST_CALL" | "CONTENT" | "FAST_WIN";

export interface EmailSignals {
  relationship_id: string | null;
  relationship_name?: string | null;
  last_email_received: string | null;
  recent_topics: string[];
  recent_asks: string[];
  recent_open_loops: string[];
  unread_count: number;
  recent_labels: string[];
  // AI-powered fields
  last_email_sentiment: Sentiment | null;
  last_email_intent: Intent | null;
  recommended_action_type: ActionType | null;
  recommended_action_description: string | null;
  recommended_due_date: string | null;
  // Comprehensive signal fields
  thread_summary_1l?: string | null;
  thread_summary_detail?: string | null;
  primary_category?: string | null;
  secondary_categories?: string[] | null;
  suggested_next_actions?: string[] | null;
  attachments?: Array<{ filename: string; type: string; reason: string }> | null;
  links?: Array<{ url: string; label: string }> | null;
  relationship_signal?: {
    signal_type: string;
    strength: "Low" | "Medium" | "High";
    evidence: string[];
  } | null;
}




