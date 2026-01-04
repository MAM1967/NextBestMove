/**
 * Channel-aware nudge detection and suggestions
 * 
 * Detects stalled conversations based on preferred channel, cadence, and last interaction.
 * Provides appropriate escalation suggestions.
 */

import type { PreferredChannel, RelationshipCadence } from "./types";

export interface StalledConversation {
  relationshipId: string;
  relationshipName: string;
  preferredChannel: PreferredChannel;
  daysSinceLastInteraction: number;
  cadenceDays: number | null;
  nudgeType: "escalate_channel" | "ask_for_call";
  suggestion: string;
}

/**
 * Channel-specific thresholds (days) for detecting stalled conversations.
 * If no response after this many days, consider it stalled.
 */
const CHANNEL_STALL_THRESHOLDS: Record<
  Exclude<PreferredChannel, null>,
  number
> = {
  linkedin: 3, // LinkedIn messages often expect quick responses
  email: 5, // Email allows more time
  text: 2, // Text messages are typically very quick
  other: 4, // Default threshold
};

/**
 * Detect if a conversation is stalled and what nudge to show.
 * 
 * A conversation is considered stalled if:
 * 1. Last interaction was more than channel-specific threshold days ago
 * 2. AND it's past the relationship's cadence
 * 3. AND there are pending actions awaiting response
 */
export function detectStalledConversation(
  relationship: {
    id: string;
    name: string;
    preferred_channel: PreferredChannel;
    last_interaction_at: string | null;
    cadence_days: number | null;
  },
  pendingActionsCount: number = 0,
  referenceDate: Date = new Date()
): StalledConversation | null {
  // Need preferred channel to detect stalls
  if (!relationship.preferred_channel) {
    return null;
  }

  // Need last interaction date
  if (!relationship.last_interaction_at) {
    return null;
  }

  const lastInteraction = new Date(relationship.last_interaction_at);
  const daysSinceLastInteraction = Math.floor(
    (referenceDate.getTime() - lastInteraction.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const threshold = CHANNEL_STALL_THRESHOLDS[relationship.preferred_channel];

  // Check if past channel-specific threshold
  const isPastThreshold = daysSinceLastInteraction >= threshold;

  // Check if past cadence (if cadence is set)
  const isPastCadence =
    relationship.cadence_days !== null
      ? daysSinceLastInteraction >= relationship.cadence_days
      : false;

  // Consider stalled if:
  // - Past channel threshold AND
  // - (Past cadence OR no cadence set) AND
  // - Has pending actions (conversation is active)
  if (isPastThreshold && (isPastCadence || relationship.cadence_days === null) && pendingActionsCount > 0) {
    // Determine appropriate nudge based on channel
    const nudge = getNudgeForChannel(
      relationship.preferred_channel,
      daysSinceLastInteraction
    );

    return {
      relationshipId: relationship.id,
      relationshipName: relationship.name,
      preferredChannel: relationship.preferred_channel,
      daysSinceLastInteraction,
      cadenceDays: relationship.cadence_days,
      ...nudge,
    };
  }

  return null;
}

/**
 * Get appropriate nudge suggestion based on channel.
 */
function getNudgeForChannel(
  channel: Exclude<PreferredChannel, null>,
  daysSinceLastInteraction: number
): { nudgeType: "escalate_channel" | "ask_for_call"; suggestion: string } {
  switch (channel) {
    case "linkedin":
      // If on LinkedIn for more than 5 days, suggest email
      if (daysSinceLastInteraction >= 5) {
        return {
          nudgeType: "escalate_channel",
          suggestion: "Move this to email",
        };
      }
      // Otherwise suggest a call
      return {
        nudgeType: "ask_for_call",
        suggestion: "Ask for a call",
      };

    case "email":
      // If on email for more than 7 days, suggest a call
      if (daysSinceLastInteraction >= 7) {
        return {
          nudgeType: "ask_for_call",
          suggestion: "Ask for a call",
        };
      }
      // Otherwise suggest follow-up email
      return {
        nudgeType: "escalate_channel",
        suggestion: "Send a follow-up email",
      };

    case "text":
      // Text messages - if more than 3 days, suggest moving to email
      if (daysSinceLastInteraction >= 3) {
        return {
          nudgeType: "escalate_channel",
          suggestion: "Move this to email",
        };
      }
      return {
        nudgeType: "ask_for_call",
        suggestion: "Ask for a call",
      };

    case "other":
    default:
      // Generic escalation
      return {
        nudgeType: "ask_for_call",
        suggestion: "Ask for a call",
      };
  }
}

/**
 * Get human-readable channel name.
 */
export function getChannelLabel(channel: PreferredChannel): string {
  switch (channel) {
    case "linkedin":
      return "LinkedIn";
    case "email":
      return "Email";
    case "text":
      return "Text";
    case "other":
      return "Other";
    default:
      return "Unknown";
  }
}

