"use client";

import { useState } from "react";
import { detectStalledConversation, getChannelLabel } from "@/lib/leads/channel-nudges";
import type { Action } from "../actions/types";
import type { LeadBasic, PreferredChannel } from "@/lib/leads/types";

interface ChannelNudgeProps {
  action: Action;
  relationship: LeadBasic | null;
  onDismiss?: (actionId: string, nudgeType: string) => void;
  onEscalate?: (actionId: string, nudgeType: string) => void;
}

/**
 * ChannelNudge component
 * 
 * Displays a gentle nudge suggesting channel escalation when a conversation is stalled.
 * Shows suggestions like "Move this to email" or "Ask for a call" based on channel and stall duration.
 */
export function ChannelNudge({
  action,
  relationship,
  onDismiss,
  onEscalate,
}: ChannelNudgeProps) {
  const [dismissed, setDismissed] = useState(false);

  // Don't show nudges for completed actions
  if (
    action.state === "DONE" ||
    action.state === "REPLIED"
  ) {
    return null;
  }

  // Need relationship data to detect stalls
  if (!relationship || !relationship.preferred_channel) {
    return null;
  }

  // Need last interaction date
  if (!relationship.last_interaction_at) {
    return null;
  }

  // Count pending actions (actions in SENT state for this relationship)
  // For now, we'll assume 1 pending action if action state is SENT
  const pendingActionsCount = action.state === "SENT" ? 1 : 0;

  // Detect stalled conversation
  const stalled = detectStalledConversation(
    {
      id: relationship.id,
      name: relationship.name,
      preferred_channel: relationship.preferred_channel,
      last_interaction_at: relationship.last_interaction_at,
      cadence_days: relationship.cadence_days || null,
    },
    pendingActionsCount
  );

  if (!stalled || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.(action.id, stalled.nudgeType);
  };

  const handleEscalate = () => {
    onEscalate?.(action.id, stalled.nudgeType);
  };

  return (
    <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-700">💡</span>
            <span className="font-medium text-blue-900">{stalled.suggestion}</span>
          </div>
          <p className="text-blue-700 text-xs">
            No response on {getChannelLabel(relationship.preferred_channel)} for{" "}
            {stalled.daysSinceLastInteraction} day
            {stalled.daysSinceLastInteraction !== 1 ? "s" : ""}. Consider trying a different
            channel.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onEscalate && (
            <button
              onClick={handleEscalate}
              className="text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline"
            >
              Try it
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-xs text-blue-600 hover:text-blue-800"
            aria-label="Dismiss suggestion"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

