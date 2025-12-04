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

export interface PersonPin {
  id: string;
  name: string;
  url: string;
  notes?: string | null;
}

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
  personPinId: string | null;
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

