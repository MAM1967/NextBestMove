import type { CalendarEvent, PersonPin, DetectedCall } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Keywords that indicate a calendar event is likely a call
 */
const CALL_KEYWORDS = [
  "call",
  "phone",
  "zoom",
  "meet",
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
];

/**
 * Detect if a calendar event is likely a call based on title
 */
export function isLikelyCall(event: CalendarEvent): boolean {
  const titleLower = event.title.toLowerCase();
  return CALL_KEYWORDS.some((keyword) => titleLower.includes(keyword));
}

/**
 * Match a calendar event to a person_pin by name
 * Attempts fuzzy matching on event title vs pin name
 */
export async function matchEventToPersonPin(
  supabase: SupabaseClient,
  userId: string,
  event: CalendarEvent
): Promise<PersonPin | null> {
  // Get all active person pins for the user
  const { data: pins } = await supabase
    .from("person_pins")
    .select("id, name, url, notes")
    .eq("user_id", userId)
    .eq("status", "ACTIVE");

  if (!pins || pins.length === 0) {
    return null;
  }

  const eventTitleLower = event.title.toLowerCase();

  // Try exact match first
  for (const pin of pins) {
    if (eventTitleLower.includes(pin.name.toLowerCase())) {
      return pin;
    }
    // Also check if pin name appears in event title
    if (eventTitleLower.includes(pin.name.toLowerCase())) {
      return pin;
    }
  }

  // Try fuzzy matching - check if any words from pin name appear in event title
  for (const pin of pins) {
    const pinWords = pin.name.toLowerCase().split(/\s+/);
    const matchingWords = pinWords.filter((word: string) =>
      eventTitleLower.includes(word)
    );
    // If at least 2 words match or it's a single word that matches, consider it a match
    if (
      matchingWords.length >= 2 ||
      (pinWords.length === 1 && matchingWords.length === 1)
    ) {
      return pin;
    }
  }

  return null;
}

/**
 * Detect calls from calendar events for the next 24 hours
 * Returns events that are likely calls, with matched person pins
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

    // Try to match to a person pin
    const matchedPin = await matchEventToPersonPin(supabase, userId, event);

    // Determine confidence
    let confidence: "high" | "medium" | "low" = "low";
    if (matchedPin) {
      // High confidence if we matched a pin
      confidence = "high";
    } else if (isLikelyCall(event)) {
      // Medium confidence if it looks like a call but no pin match
      confidence = "medium";
    }

    upcomingCalls.push({
      event,
      matchedPersonPin: matchedPin,
      confidence,
    });
  }

  return upcomingCalls;
}

