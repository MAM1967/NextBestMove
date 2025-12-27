"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { StalledConversation } from "@/lib/leads/channel-nudges";
import { getChannelLabel } from "@/lib/leads/channel-nudges";

/**
 * ChannelNudgeCard - Displays a nudge for a stalled conversation
 */
export function ChannelNudgeCard({
  stalledConversation,
  onDismiss,
}: {
  stalledConversation: StalledConversation;
  onDismiss: (relationshipId: string) => void;
}) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    // Store dismissal in localStorage (per session)
    // In a full implementation, you might want to persist this in the database
    const dismissedKey = `nudge_dismissed_${stalledConversation.relationshipId}`;
    localStorage.setItem(dismissedKey, Date.now().toString());
    onDismiss(stalledConversation.relationshipId);
  };

  // Check if already dismissed (on mount)
  useEffect(() => {
    const dismissedKey = `nudge_dismissed_${stalledConversation.relationshipId}`;
    const dismissedAt = localStorage.getItem(dismissedKey);
    if (dismissedAt) {
      // Check if dismissed within last 24 hours (reset after 24h)
      const dismissedTime = parseInt(dismissedAt, 10);
      const hoursSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissal < 24) {
        setIsDismissed(true);
      } else {
        // Clear old dismissal
        localStorage.removeItem(dismissedKey);
      }
    }
  }, [stalledConversation.relationshipId]);

  if (isDismissed) {
    return null;
  }

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-orange-800 uppercase tracking-wide">
              Stalled Conversation
            </span>
            <span className="text-xs text-orange-600">
              {getChannelLabel(stalledConversation.preferredChannel)}
            </span>
          </div>
          <p className="text-sm text-orange-900 font-medium mb-1">
            <Link
              href={`/app/leads?leadId=${stalledConversation.relationshipId}`}
              className="hover:underline"
            >
              {stalledConversation.relationshipName}
            </Link>
          </p>
          <p className="text-xs text-orange-700">
            {stalledConversation.daysSinceLastInteraction} days since last interaction
            {stalledConversation.cadenceDays
              ? ` (cadence: ${stalledConversation.cadenceDays} days)`
              : ""}
          </p>
          <p className="text-sm text-orange-800 mt-2 font-medium">
            💡 {stalledConversation.suggestion}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 text-orange-400 hover:text-orange-600"
          aria-label="Dismiss nudge"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * ChannelNudgesList - Displays all stalled conversation nudges
 */
export function ChannelNudgesList() {
  const [stalledConversations, setStalledConversations] = useState<
    StalledConversation[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStalledConversations() {
      try {
        const response = await fetch("/api/leads/stalled-conversations");
        if (!response.ok) {
          throw new Error("Failed to load stalled conversations");
        }
        const data = await response.json();
        setStalledConversations(data.stalledConversations || []);
      } catch (error) {
        console.error("Error fetching stalled conversations:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStalledConversations();
  }, []);

  const handleDismiss = (relationshipId: string) => {
    setStalledConversations((prev) =>
      prev.filter((sc) => sc.relationshipId !== relationshipId)
    );
  };

  if (loading) {
    return null; // Don't show loading state, just hide
  }

  if (stalledConversations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {stalledConversations.map((stalled) => (
        <ChannelNudgeCard
          key={stalled.relationshipId}
          stalledConversation={stalled}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
}




