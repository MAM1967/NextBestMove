import type { CalendarEvent, PersonPin, DetectedCall } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Keywords and phrases that indicate a calendar event is likely a call/meeting
 * 
 * Note: Users should name calendar events with these keywords for pre-call briefs to work.
 * Examples: "Call with John", "Zoom with Sarah", "Google Meet: Project Review", "Teams sync"
 */
const CALL_KEYWORDS = [
  // Single words
  "call",
  "phone",
  "zoom",
  "teams",
  "meeting",
  "sync",
  "chat",
  "discussion",
  "conversation",
  "interview",
  "demo",
  "consultation",
  "check-in",
  "touch base",
  "catch up",
  // Multi-word phrases (must match exactly)
  "google meet",
  "google hangouts",
  "microsoft teams",
  "zoom meeting",
  "video call",
  "phone call",
  "conference call",
];

/**
 * Detect if a calendar event is likely a call based on video conferencing fields or title
 * 
 * Priority:
 * 1. Check if event has video conferencing link/field (most reliable)
 * 2. Check title for keywords/phrases (fallback)
 * 
 * Users should name events with keywords like "call", "zoom", "Google Meet", "Teams" for this to work
 * if the calendar provider doesn't expose video conferencing fields.
 */
export function isLikelyCall(event: CalendarEvent): boolean {
  // First check: Does the event have a video conferencing link/field?
  // This is the most reliable indicator - calendars automatically add these when video is enabled
  if (event.hasVideoConference === true || event.videoConferenceLink) {
    return true;
  }
  
  // Fallback: Check title for keywords
  const titleLower = event.title.toLowerCase();
  
  // Check multi-word phrases first (more specific)
  const phrases = CALL_KEYWORDS.filter((keyword) => keyword.includes(" "));
  if (phrases.some((phrase) => titleLower.includes(phrase))) {
    return true;
  }
  
  // Then check single words
  const singleWords = CALL_KEYWORDS.filter((keyword) => !keyword.includes(" "));
  return singleWords.some((keyword) => titleLower.includes(keyword));
}

/**
 * Match a calendar event to a lead by name
 * Attempts fuzzy matching on event title vs lead name
 */
export async function matchEventToLead(
  supabase: SupabaseClient,
  userId: string,
  event: CalendarEvent
): Promise<PersonPin | null> {
  // Get all active leads for the user
  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, url, notes")
    .eq("user_id", userId)
    .eq("status", "ACTIVE");

  if (!leads || leads.length === 0) {
    return null;
  }

  const eventTitleLower = event.title.toLowerCase();

  // Try exact match first
  for (const lead of leads) {
    if (eventTitleLower.includes(lead.name.toLowerCase())) {
      return lead;
    }
    // Also check if lead name appears in event title
    if (eventTitleLower.includes(lead.name.toLowerCase())) {
      return lead;
    }
  }

  // Try fuzzy matching - check if any words from lead name appear in event title
  for (const lead of leads) {
    const leadWords = lead.name.toLowerCase().split(/\s+/);
    const matchingWords = leadWords.filter((word: string) =>
      eventTitleLower.includes(word)
    );
    // If at least 2 words match or it's a single word that matches, consider it a match
    if (
      matchingWords.length >= 2 ||
      (leadWords.length === 1 && matchingWords.length === 1)
    ) {
      return lead;
    }
  }

  return null;
}

/**
 * Detect calls from calendar events for the next 24 hours
 * Returns events that are likely calls, with matched leads
 */
export async function detectUpcomingCalls(
  supabase: SupabaseClient,
  userId: string,
  events: CalendarEvent[]
): Promise<DetectedCall[]> {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const upcomingCalls: DetectedCall[] = [];

  for (const event of events) {
    const eventStart = new Date(event.start);

    // Only consider events in the next 24 hours
    if (eventStart < now || eventStart > tomorrow) {
      continue;
    }

    // Check if event is likely a call
    if (!isLikelyCall(event)) {
      continue;
    }

    // Try to match to a lead
    const matchedLead = await matchEventToLead(supabase, userId, event);

    // Determine confidence
    let confidence: "high" | "medium" | "low" = "low";
    if (matchedLead) {
      // High confidence if we matched a lead
      confidence = "high";
    } else if (isLikelyCall(event)) {
      // Medium confidence if it looks like a call but no lead match
      confidence = "medium";
    }

    upcomingCalls.push({
      event,
      matchedPersonPin: matchedLead, // Keep property name for backward compatibility
      confidence,
    });
  }

  return upcomingCalls;
}

