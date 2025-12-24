/**
 * Lead types and interfaces
 * 
 * Replaces PersonPin types from the "pins" terminology.
 * A Lead represents a person/contact that the user is tracking.
 */

export type LeadStatus = "ACTIVE" | "SNOOZED" | "ARCHIVED";
export type RelationshipCadence = "frequent" | "moderate" | "infrequent" | "ad_hoc" | null;
export type RelationshipTier = "inner" | "active" | "warm" | "background" | null;
export type PreferredChannel = "linkedin" | "email" | "text" | "other" | null;

export type LeadFilter = "ALL" | LeadStatus;

/**
 * Full Lead interface with all fields from the database
 */
export interface Lead {
  id: string;
  user_id: string;
  name: string;
  url: string;
  notes?: string | null;
  status: LeadStatus;
  snooze_until?: string | null;
  // Relationship cadence and tier fields (NEX-5)
  cadence?: RelationshipCadence;
  cadence_days?: number | null;
  tier?: RelationshipTier;
  last_interaction_at?: string | null;
  next_touch_due_at?: string | null;
  // Preferred communication channel (NEX-15)
  preferred_channel?: PreferredChannel;
  created_at: string;
  updated_at: string;
}

/**
 * Simplified Lead interface for cases where status is not needed
 * (e.g., in action cards, pre-call briefs)
 * 
 * Note: Some fields are optional since they may not always be included in queries
 * (e.g., preferred_channel, last_interaction_at needed for channel nudges)
 */
export interface LeadBasic {
  id: string;
  name: string;
  url: string;
  notes?: string | null;
  // Optional fields that may be included for channel awareness and nudges
  preferred_channel?: PreferredChannel;
  last_interaction_at?: string | null;
  cadence_days?: number | null;
}

