"use client";

import { useState } from "react";
import { Action } from "./types";

type PriorityLevel = "high" | "medium" | "low";

interface PriorityIndicatorProps {
  action: Action;
  showTooltip?: boolean;
}

/**
 * Calculate priority level based on action state, type, and due date
 */
function calculatePriorityLevel(action: Action): {
  level: PriorityLevel;
  reason: string;
} {
  // Highest priority: REPLIED state (next action after reply)
  if (action.state === "REPLIED") {
    return {
      level: "high",
      reason: "Next action after receiving a reply - respond while the conversation is fresh",
    };
  }

  // High priority: Snoozed action now due
  if (action.state === "SNOOZED" && action.snooze_until) {
    // Normalize snooze date to local midnight
    const [year, month, day] = action.snooze_until.split('-').map(Number);
    const snoozeDate = new Date(year, month - 1, day);
    snoozeDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (snoozeDate <= today) {
      return {
        level: "high",
        reason: "Snoozed action is now due - time to follow up",
      };
    }
  }

  // Check due date urgency
  // Normalize due date to local midnight
  const [year, month, day] = action.due_date.split('-').map(Number);
  const dueDate = new Date(year, month - 1, day);
  dueDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysDiff = Math.floor(
    (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // High priority: FOLLOW_UP due today or overdue
  if (action.action_type === "FOLLOW_UP") {
    if (daysDiff === 0) {
      return {
        level: "high",
        reason: "Follow-up due today - maintain momentum",
      };
    } else if (daysDiff > 0 && daysDiff <= 3) {
      return {
        level: "high",
        reason: `Follow-up overdue by ${daysDiff} day${daysDiff > 1 ? "s" : ""} - prioritize to stay on track`,
      };
    } else if (daysDiff > 3) {
      return {
        level: "medium",
        reason: "Follow-up overdue - still important but less urgent",
      };
    }
  }

  // Medium priority: POST_CALL or CALL_PREP
  if (
    action.action_type === "POST_CALL" ||
    action.action_type === "CALL_PREP"
  ) {
    if (daysDiff === 0) {
      return {
        level: "high",
        reason: "Call-related action due today",
      };
    }
    return {
      level: "medium",
      reason: "Call-related action - important for relationship building",
    };
  }

  // Medium priority: OUTREACH
  if (action.action_type === "OUTREACH") {
    return {
      level: "medium",
      reason: "Outreach action - building new connections",
    };
  }

  // Lower priority: NURTURE or CONTENT
  if (action.action_type === "NURTURE" || action.action_type === "CONTENT") {
    return {
      level: "low",
      reason: "Nurture or content action - important but less time-sensitive",
    };
  }

  // Default
  return {
    level: "medium",
    reason: "Standard priority action",
  };
}

/**
 * Get urgency indicator based on due date
 */
function getUrgencyIndicator(action: Action): {
  label: string;
  className: string;
  icon: string;
} | null {
  // Normalize due date to local midnight
  const [year, month, day] = action.due_date.split('-').map(Number);
  const dueDate = new Date(year, month - 1, day);
  dueDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysDiff = Math.floor(
    (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff === 0) {
    return {
      label: "Due today",
      className: "bg-orange-100 text-orange-800",
      icon: "⚠️",
    };
  } else if (daysDiff > 0) {
    return {
      label: `Overdue ${daysDiff} day${daysDiff > 1 ? "s" : ""}`,
      className: "bg-red-100 text-red-800",
      icon: "🔴",
    };
  } else if (daysDiff === -1) {
    return {
      label: "Due tomorrow",
      className: "bg-yellow-100 text-yellow-800",
      icon: "⏰",
    };
  }

  return null;
}

export function PriorityIndicator({
  action,
  showTooltip = true,
}: PriorityIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { level, reason } = calculatePriorityLevel(action);
  const urgency = getUrgencyIndicator(action);

  // Priority badge configuration - compact H/M/L format
  const priorityConfig = {
    high: {
      label: "H",
      fullLabel: "High",
      className: "bg-red-100 text-red-700 border-red-200",
    },
    medium: {
      label: "M",
      fullLabel: "Medium",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    low: {
      label: "L",
      fullLabel: "Low",
      className: "bg-green-100 text-green-700 border-green-200",
    },
  };

  const config = priorityConfig[level];

  // Build detailed tooltip text with full priority name
  const getTooltipText = () => {
    const parts = [`${config.fullLabel} Priority`];
    if (urgency) {
      parts.push(urgency.label);
    }
    parts.push(reason);
    return parts.join(". ");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowDetails(!showDetails);
        }}
        className={`inline-flex items-center justify-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-semibold transition-colors ${config.className} hover:opacity-80`}
        aria-label="Priority details"
      >
        <span className="leading-none font-bold">{config.label}</span>
        {showTooltip && (
          <span className="inline-flex items-center justify-center h-4 w-4 rounded-full border-2 border-current shrink-0 font-bold" style={{ fontSize: '11px', lineHeight: '1', paddingTop: '1px' }}>
            i
          </span>
        )}
      </button>
      {showDetails && showTooltip && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDetails(false)}
          />
          {/* Tooltip */}
          <div className="absolute bottom-full left-0 z-20 mb-2 w-64 rounded-lg px-3 py-2 text-xs text-white shadow-lg" style={{ backgroundColor: '#0000CD' }}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">{getTooltipText()}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(false);
                }}
                className="shrink-0 text-white/80 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg
                  className="h-3.5 w-3.5"
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
            <div className="absolute bottom-0 left-4 h-2 w-2 -translate-x-1/2 translate-y-1/2 rotate-45" style={{ backgroundColor: '#0000CD' }}></div>
          </div>
        </>
      )}
    </div>
  );
}

