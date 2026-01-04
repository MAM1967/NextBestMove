"use client";

import { Action } from "../actions/types";
import { PriorityIndicator } from "../actions/PriorityIndicator";
import { getDaysDifference, formatDateForDisplay } from "@/lib/utils/dateUtils";
import { useState } from "react";
import { PromiseModal } from "../actions/PromiseModal";
import { formatPromiseDate, isPromiseOverdue } from "@/lib/utils/promiseUtils";
import { ChannelNudge } from "./ChannelNudge";
import { SourceBadge } from "./SourceBadge";

interface UnifiedActionCardProps {
  action: Action;
  onComplete: (actionId: string, completionType?: string) => void;
  onSnooze: (actionId: string) => void;
  onAddNote: (actionId: string) => void;
  onGotReply?: (actionId: string) => void;
  onViewPrompt?: (action: Action) => void;
  onClick?: (action: Action) => void;
  onSetPromise?: (actionId: string, promisedDueAt: string | null) => Promise<void>;
  onSetEstimatedMinutes?: (actionId: string) => void;
  userTimeZone?: string;
  workEndTime?: string | null;
}

function getActionTypeBadgeVariant(actionType: Action["action_type"]): string {
  switch (actionType) {
    case "FOLLOW_UP":
      return "bg-orange-100 text-orange-800";
    case "OUTREACH":
      return "bg-blue-100 text-blue-800";
    case "NURTURE":
      return "bg-green-100 text-green-800";
    case "CALL_PREP":
      return "bg-purple-100 text-purple-800";
    case "POST_CALL":
      return "bg-indigo-100 text-indigo-800";
    case "CONTENT":
      return "bg-pink-100 text-pink-800";
    case "FAST_WIN":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

function getActionTypeLabel(actionType: Action["action_type"]): string {
  return actionType.replace("_", " ");
}

function getUrlTypeLabel(url: string | null | undefined): string {
  if (!url) {
    return "Link";
  }
  if (url.startsWith("mailto:")) {
    return "Email";
  }
  if (url.includes("linkedin.com")) {
    return "LinkedIn";
  }
  if (url.startsWith("http")) {
    return "Link";
  }
  return "URL";
}

function getActionTitle(action: Action): string {
  if (action.description) {
    return action.description;
  }
  if (action.leads) {
    return `${getActionTypeLabel(action.action_type)} with ${
      action.leads.name
    }`;
  }
  return getActionTypeLabel(action.action_type);
}

/**
 * UnifiedActionCard component
 * 
 * Unified action card component used across all pages (Today, Daily Plan, Actions)
 * to ensure consistent look and feel. Full-width card design with comprehensive
 * action information and buttons.
 * 
 * NEX-48: Unified Action Card Component
 */
export function UnifiedActionCard({
  action,
  onComplete,
  onSnooze,
  onAddNote,
  onGotReply,
  onViewPrompt,
  onClick,
  onSetPromise,
  onSetEstimatedMinutes,
  userTimeZone = "America/New_York",
  workEndTime = null,
}: UnifiedActionCardProps) {
  const [showPromiseModal, setShowPromiseModal] = useState(false);
  
  const isCompleted =
    action.state === "DONE" ||
    action.state === "REPLIED" ||
    action.state === "SENT";
  
  // Check if promise is overdue
  const promiseOverdue = action.promised_due_at ? isPromiseOverdue(action.promised_due_at) : false;
  
  // Check if promise is due soon (within 2 days)
  const isPromiseDueSoon = action.promised_due_at
    ? (() => {
        const promisedDate = new Date(action.promised_due_at);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        promisedDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor(
          (promisedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysDiff >= 0 && daysDiff <= 2;
      })()
    : false;
  
  const handleSetPromise = async (actionId: string, promisedDueAt: string | null) => {
    if (!onSetPromise) return;
    await onSetPromise(actionId, promisedDueAt);
  };

  const getActionButtons = () => {
    // If action is completed, only show "Add note" button
    if (isCompleted) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddNote(action.id);
          }}
          className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
        >
          Add note
        </button>
      );
    }
    switch (action.action_type) {
      case "FOLLOW_UP":
        return (
          <>
            {onGotReply && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onGotReply(action.id);
                }}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Done - Got reply
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete(action.id, "sent");
              }}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Done - No reply yet
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSnooze(action.id);
              }}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Snooze
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddNote(action.id);
              }}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Add note
            </button>
            {onSetPromise && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPromiseModal(true);
                }}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  action.promised_due_at
                    ? "text-purple-600 hover:bg-purple-50"
                    : "text-blue-600 hover:bg-blue-50"
                }`}
              >
                {action.promised_due_at ? "Update promise" : "Mark as promised"}
              </button>
            )}
          </>
        );
      case "CONTENT":
        return (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete(action.id);
              }}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Done
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSnooze(action.id);
              }}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Snooze
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewPrompt?.(action);
              }}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              View prompt
            </button>
            {onSetPromise && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPromiseModal(true);
                }}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  action.promised_due_at
                    ? "text-purple-600 hover:bg-purple-50"
                    : "text-blue-600 hover:bg-blue-50"
                }`}
              >
                {action.promised_due_at ? "Update promise" : "Mark as promised"}
              </button>
            )}
          </>
        );
      default:
        return (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete(action.id);
              }}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Done
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSnooze(action.id);
              }}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Snooze
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddNote(action.id);
              }}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Add note
            </button>
            {onSetEstimatedMinutes && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetEstimatedMinutes(action.id);
                }}
                className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                title={action.estimated_minutes ? `Update time estimate (${action.estimated_minutes} min)` : "Set time estimate"}
              >
                {action.estimated_minutes ? `${action.estimated_minutes} min` : "Set time"}
              </button>
            )}
            {onSetPromise && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPromiseModal(true);
                }}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  action.promised_due_at
                    ? "text-purple-600 hover:bg-purple-50"
                    : "text-blue-600 hover:bg-blue-50"
                }`}
              >
                {action.promised_due_at ? "Update promise" : "Mark as promised"}
              </button>
            )}
          </>
        );
    }
  };

  return (
    <div
      data-testid={`action-card-${action.id}`}
      className={`w-full rounded-xl border p-4 transition-shadow hover:shadow-md ${
        isCompleted ? "opacity-75" : ""
      } ${
        promiseOverdue
          ? "border-red-500 bg-red-50"
          : isPromiseDueSoon
          ? "border-orange-400 bg-orange-50"
          : action.promised_due_at
          ? "border-blue-300 bg-blue-50"
          : "border-zinc-200 bg-white"
      }`}
      onClick={() => onClick?.(action)}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {/* Priority indicator - subtle dot, shown first */}
                {!isCompleted && <PriorityIndicator action={action} />}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${getActionTypeBadgeVariant(
                    action.action_type
                  )}`}
                >
                  {getActionTypeLabel(action.action_type)}
                </span>
              </div>
              {/* State badges - render based on state */}
              {(() => {
                const state = String(action.state).trim();
                if (state === "DONE") {
                  return (
                    <span
                      style={{
                        display: "inline-block",
                        backgroundColor: "#16a34a",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        border: "2px solid #15803d",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      }}
                    >
                      ✓ Done
                    </span>
                  );
                }
                if (state === "SENT") {
                  return (
                    <span
                      style={{
                        display: "inline-block",
                        backgroundColor: "#2563eb",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        border: "2px solid #1e40af",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      }}
                    >
                      ✓ Sent
                    </span>
                  );
                }
                if (state === "REPLIED") {
                  return (
                    <span
                      style={{
                        display: "inline-block",
                        backgroundColor: "#16a34a",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        border: "2px solid #15803d",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      }}
                    >
                      ✓ Replied
                    </span>
                  );
                }
                if (state === "SNOOZED") {
                  return (
                    <span
                      style={{
                        display: "inline-block",
                        backgroundColor: "#d97706",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        border: "2px solid #b45309",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      }}
                    >
                      ⏸ Snoozed
                    </span>
                  );
                }
                return null;
              })()}
              {/* Estimated minutes indicator */}
              {action.estimated_minutes && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                  ~{action.estimated_minutes} min
                </span>
              )}
            </div>
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-lg font-semibold text-zinc-900">
                {getActionTitle(action)}
              </h4>
              {/* Promise indicator badge */}
              {action.promised_due_at && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    promiseOverdue
                      ? "bg-red-600 text-white"
                      : isPromiseDueSoon
                      ? "bg-orange-500 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                  title={formatPromiseDate(action.promised_due_at)}
                >
                  {promiseOverdue ? "⚠️ Overdue Promise" : "✓ Promised"}
                </span>
              )}
            </div>
            {/* Relationship or General Business badge */}
            {action.leads ? (
              <div className="mt-1 text-sm text-zinc-600">
                <span className="font-medium">{action.leads.name}</span>
                {action.leads.url && (
                  <span className="ml-2 text-zinc-400">
                    {(() => {
                      const url = action.leads.url;
                      if (url?.startsWith("mailto:")) return "Email";
                      if (url?.includes("linkedin.com")) return "LinkedIn";
                      return "Link";
                    })()}
                  </span>
                )}
              </div>
            ) : (
              <div className="mt-1">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                  General Business
                </span>
              </div>
            )}
            <div className="mt-1 flex items-center gap-4 text-sm">
              {/* Source badge */}
              {action.source && (
                <SourceBadge source={action.source} />
              )}
              {(() => {
                // Use date-fns for reliable date comparison
                const daysDiff = getDaysDifference(action.due_date);

                let dateColor = "text-zinc-500";
                let urgencyText = "";

                if (daysDiff === 0) {
                  dateColor = "text-orange-600 font-medium";
                  urgencyText = "Due today";
                } else if (daysDiff > 0) {
                  dateColor = "text-red-600 font-medium";
                  urgencyText = `Overdue ${daysDiff} day${
                    daysDiff > 1 ? "s" : ""
                  }`;
                } else if (daysDiff === -1) {
                  dateColor = "text-yellow-600";
                  urgencyText = "Due tomorrow";
                }

                return (
                  <span className={`flex items-center gap-1.5 ${dateColor}`}>
                    <svg
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-medium">Due:</span>
                    <span>
                      {formatDateForDisplay(action.due_date)}
                      {urgencyText && (
                        <span className="ml-1.5 text-xs opacity-75">
                          ({urgencyText})
                        </span>
                      )}
                    </span>
                  </span>
                );
              })()}
              {action.leads && (action.leads.linkedin_url || action.leads.email || action.leads.url) && (
                <a
                  href={action.leads.linkedin_url || action.leads.email || action.leads.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-zinc-900 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {getUrlTypeLabel(action.leads.linkedin_url || action.leads.email || action.leads.url)}
                </a>
              )}
            </div>
            {/* Promised follow-up indicator */}
            {action.promised_due_at && (
              <div
                className={`mt-2 flex items-start gap-2 text-sm ${
                  promiseOverdue
                    ? "text-red-700 font-medium"
                    : isPromiseDueSoon
                    ? "text-orange-700"
                    : "text-blue-700"
                }`}
              >
                <svg
                  className="h-4 w-4 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{formatPromiseDate(action.promised_due_at)}</span>
              </div>
            )}
            {action.notes && (
              <div className="mt-2 flex items-start gap-2 text-sm text-zinc-600">
                <svg
                  className="h-4 w-4 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span className="italic">{action.notes}</span>
              </div>
            )}
            {/* Channel nudge - show if conversation is stalled */}
            {action.leads && (
              <ChannelNudge
                action={action}
                relationship={action.leads}
                onDismiss={(actionId, nudgeType) => {
                  // TODO: Implement nudge dismissal (store in local state or backend)
                  console.log("Dismiss nudge", actionId, nudgeType);
                }}
                onEscalate={(actionId, nudgeType) => {
                  // TODO: Implement escalation (e.g., create new action or switch channel)
                  console.log("Escalate", actionId, nudgeType);
                }}
              />
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {getActionButtons()}
        </div>
      </div>
      
      {onSetPromise && (
        <PromiseModal
          isOpen={showPromiseModal}
          onClose={() => setShowPromiseModal(false)}
          actionId={action.id}
          currentPromise={action.promised_due_at || undefined}
          userTimeZone={userTimeZone}
          workEndTime={workEndTime}
          onSetPromise={handleSetPromise}
        />
      )}
    </div>
  );
}

