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

export interface EmailSignals {
  relationship_id: string | null;
  relationship_name?: string | null;
  last_email_received: string | null;
  recent_topics: string[];
  recent_asks: string[];
  recent_open_loops: string[];
  unread_count: number;
  recent_labels: string[];
}

