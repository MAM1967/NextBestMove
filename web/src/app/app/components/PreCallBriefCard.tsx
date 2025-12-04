"use client";

import { useState } from "react";
import type { PreCallBrief } from "@/lib/pre-call-briefs/types";

interface PreCallBriefCardProps {
  brief: PreCallBrief;
  onViewFull?: () => void;
}

export function PreCallBriefCard({ brief, onViewFull }: PreCallBriefCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const eventTime = new Date(brief.eventStart);
  const timeStr = eventTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  // Extract first few lines for preview
  const previewLines = brief.briefContent.split("\n").slice(0, 3).join("\n");
  const hasMore = brief.briefContent.split("\n").length > 3;

  const isVideoConference = brief.hasVideoConference === true;
  const icon = isVideoConference ? "📹" : "📞";
  const label = isVideoConference ? "Upcoming Video Conference" : "Upcoming Call";

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
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
        {onViewFull && (
          <button
            onClick={onViewFull}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            View Brief
          </button>
        )}
      </div>

      {isExpanded ? (
        <div className="mt-3 text-xs text-zinc-700 whitespace-pre-wrap">
          {brief.briefContent}
        </div>
      ) : (
        <div className="mt-3 text-xs text-zinc-600 line-clamp-3">
          {previewLines}
        </div>
      )}

      {hasMore && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Show more
        </button>
      )}
    </div>
  );
}

