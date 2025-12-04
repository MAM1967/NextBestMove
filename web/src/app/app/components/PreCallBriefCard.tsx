"use client";

import { useState } from "react";
import type { PreCallBrief } from "@/lib/pre-call-briefs/types";

interface PreCallBriefCardProps {
  brief: PreCallBrief;
  isPremium?: boolean;
  onViewFull?: () => void;
}

export function PreCallBriefCard({ brief, isPremium = false, onViewFull }: PreCallBriefCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const eventTime = new Date(brief.eventStart);
  const timeStr = eventTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const isVideoConference = brief.hasVideoConference === true;
  const icon = isVideoConference ? "📹" : "📞";
  const label = isVideoConference ? "Upcoming Video Conference" : "Upcoming Call";

  // For Standard users, show teaser info instead of brief content
  const showTeaser = !isPremium && brief.followUpCount > 0;

  const handleUpgrade = async () => {
    if (isPremium || !onViewFull) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/billing/customer-portal", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to open billing portal");
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error("No portal URL returned");
      }
      window.location.href = url;
    } catch (error) {
      console.error("Error opening billing portal:", error);
      alert("Unable to open billing portal. Please try again later.");
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm h-full min-h-[200px] flex flex-col">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-700">
              {icon} {label}
            </span>
            <span className="text-xs text-zinc-600">{timeStr}</span>
          </div>
          <h3 className="mt-1 text-sm font-medium text-zinc-900">
            {brief.eventTitle}
          </h3>
          {brief.personName && (
            <p className="mt-1 text-xs text-zinc-600">with {brief.personName}</p>
          )}
        </div>
      </div>

      {/* Content area - different for Premium vs Standard */}
      {isPremium ? (
        // Premium: Show full brief content
        <>
          {isExpanded ? (
            <div className="mt-3 text-xs text-zinc-700 whitespace-pre-wrap">
              {brief.briefContent}
            </div>
          ) : (
            <div className="mt-3 text-xs text-zinc-600 line-clamp-3">
              {brief.briefContent.split("\n").slice(0, 3).join("\n")}
            </div>
          )}
          {brief.briefContent.split("\n").length > 3 && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Show more
            </button>
          )}
        </>
      ) : (
        // Standard: Show teaser with upgrade CTA
        <div className="mt-3 space-y-2">
          {showTeaser && (
            <div className="text-xs text-zinc-600">
              <span className="font-medium">{brief.followUpCount}</span> previous interaction{brief.followUpCount !== 1 ? "s" : ""} with this contact
            </div>
          )}
          <div className="relative rounded-md border border-blue-200 bg-white p-3 flex-grow flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 backdrop-blur-sm rounded-md">
              <div className="text-center">
                <p className="text-xs font-medium text-blue-700 mb-1">
                  Interaction history & talking points
                </p>
                <button
                  onClick={handleUpgrade}
                  disabled={isLoading}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
                >
                  {isLoading ? "Loading..." : "Upgrade to Premium to view"}
                </button>
              </div>
            </div>
            {/* Blurred content behind overlay */}
            <div className="text-xs text-zinc-400 blur-sm select-none">
              {brief.briefContent.split("\n").slice(0, 4).join("\n")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

