export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  duration: number; // minutes
  isAllDay: boolean;
  // Video conferencing fields (if available)
  videoConferenceLink?: string | null; // Google Meet link, Zoom link, Teams link, etc.
  hasVideoConference?: boolean; // True if event has any video conferencing
}

import type { LeadBasic } from "@/lib/leads/types";

// Re-export for convenience
export type PersonPin = LeadBasic;

export interface ActionHistory {
  lastActionDate: Date | null;
  lastActionNotes: string | null;
  totalActions: number;
  repliesReceived: number;
  lastReplyDate: Date | null;
}

export interface PreCallBrief {
  id?: string;
  calendarEventId: string;
  eventTitle: string;
  eventStart: Date;
  leadId: string | null; // Maps to person_pin_id in database (legacy column name)
  personPinId: string | null; // Legacy field for backward compatibility
  personName: string | null;
  briefContent: string;
  lastInteractionDate: Date | null;
  followUpCount: number;
  nextStepSuggestions: string[];
  userNotes: string | null;
  hasVideoConference?: boolean; // True if event has video conferencing
}

export interface DetectedCall {
  event: CalendarEvent;
  matchedPersonPin: PersonPin | null;
  confidence: "high" | "medium" | "low";
}

