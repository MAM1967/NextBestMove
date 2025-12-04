/**
 * Lead types and interfaces
 * 
 * Replaces PersonPin types from the "pins" terminology.
 * A Lead represents a person/contact that the user is tracking.
 */

export type LeadStatus = "ACTIVE" | "SNOOZED" | "ARCHIVED";

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
  created_at: string;
  updated_at: string;
}

/**
 * Simplified Lead interface for cases where status is not needed
 * (e.g., in action cards, pre-call briefs)
 */
export interface LeadBasic {
  id: string;
  name: string;
  url: string;
  notes?: string | null;
}

