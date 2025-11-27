"use client";

import { Action } from "./types";

interface ActionCardProps {
  action: Action;
  onComplete: (actionId: string, completionType?: string) => void;
  onSnooze: (actionId: string) => void;
  onAddNote: (actionId: string) => void;
  onGotReply?: (actionId: string) => void;
  onViewPrompt?: (action: Action) => void;
  onClick?: (action: Action) => void;
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

function getUrlTypeLabel(url: string): string {
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
  if (action.person_pins) {
    return `${getActionTypeLabel(action.action_type)} with ${action.person_pins.name}`;
  }
  return getActionTypeLabel(action.action_type);
}

export function ActionCard({
  action,
  onComplete,
  onSnooze,
  onAddNote,
  onGotReply,
  onViewPrompt,
  onClick,
}: ActionCardProps) {
  
  const isCompleted = action.state === "DONE" || action.state === "REPLIED" || action.state === "SENT";
  
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
                console.log("Done - No reply yet clicked for action:", action.id);
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
          </>
        );
    }
  };

  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md ${
        isCompleted ? "opacity-75" : ""
      }`}
      onClick={() => onClick?.(action)}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${getActionTypeBadgeVariant(
                  action.action_type
                )}`}
              >
                {getActionTypeLabel(action.action_type)}
              </span>
              {/* State badges - render based on state */}
              {(() => {
                const state = String(action.state).trim();
                if (state === "DONE") {
                  return (
                    <span 
                      style={{ 
                        display: 'inline-block',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '2px solid #15803d',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
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
                        display: 'inline-block',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '2px solid #1e40af',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
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
                        display: 'inline-block',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '2px solid #15803d',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
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
                        display: 'inline-block',
                        backgroundColor: '#d97706',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '2px solid #b45309',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      ⏸ Snoozed
                    </span>
                  );
                }
                return null;
              })()}
            </div>
            <h4 className="text-lg font-semibold text-zinc-900">
              {getActionTitle(action)}
            </h4>
            <div className="mt-1 flex items-center gap-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4 flex-shrink-0"
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
                {new Date(action.due_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year:
                    new Date(action.due_date).getFullYear() !==
                    new Date().getFullYear()
                      ? "numeric"
                      : undefined,
                })}
              </span>
              {action.person_pins && (
                <a
                  href={action.person_pins.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-zinc-900 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {getUrlTypeLabel(action.person_pins.url)}
                </a>
              )}
            </div>
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
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">{getActionButtons()}</div>
      </div>
    </div>
  );
}

