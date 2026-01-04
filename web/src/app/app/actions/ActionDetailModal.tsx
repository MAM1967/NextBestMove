"use client";

import { useState, useEffect } from "react";
import { Action } from "./types";
import { formatDateForDisplay } from "@/lib/utils/dateUtils";
import { formatDistanceToNow } from "date-fns";

interface ActionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionId: string | null;
  onActionClick?: (actionId: string) => void;
}

interface ActionDetail {
  action: Action & {
    history?: Array<{
      event: string;
      timestamp: string;
      state?: string;
    }>;
    relatedActions?: Array<{
      id: string;
      action_type: string;
      state: string;
      due_date: string;
      description: string | null;
      created_at: string;
      completed_at: string | null;
    }>;
  };
}

function getActionTypeLabel(actionType: string): string {
  return actionType.replace("_", " ");
}

function getStateLabel(state: string): string {
  return state.replace("_", " ");
}

// DealProgressionSection removed from UI per NEX-51 (kept in database)
export function ActionDetailModal({
  isOpen,
  onClose,
  actionId,
  onActionClick,
}: ActionDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionDetail, setActionDetail] = useState<ActionDetail | null>(null);

  useEffect(() => {
    if (isOpen && actionId) {
      fetchActionDetail();
    } else {
      setActionDetail(null);
      setError(null);
    }
  }, [isOpen, actionId]);

  const fetchActionDetail = async () => {
    if (!actionId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/actions/${actionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch action details");
      }
      const data = await response.json();
      setActionDetail(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load action details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTrackEvent = async (eventType: "next_call_calendared" | "replied_to_email" | "got_response") => {
    if (!actionId) return;

    try {
      const response = await fetch(`/api/actions/${actionId}/completion-tracking`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: eventType,
          notes: eventType === "got_response" ? prompt("Add notes about the response (optional):") || undefined : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to track event");
      }

      // Refresh action details
      await fetchActionDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to track event");
    }
  };

  const handleCloseAndTransition = async () => {
    if (!actionId || !action) return;

    try {
      // Call API to close action and transition relationship state
      const response = await fetch(`/api/actions/${actionId}/close-and-transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: action.notes || undefined,
          completion_events: {
            next_call_calendared_at: action.next_call_calendared_at,
            replied_to_email_at: action.replied_to_email_at,
            got_response_at: action.got_response_at,
            got_response_notes: action.got_response_notes,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to close and transition");
      }

      // Close modal and refresh
      onClose();
      // Optionally trigger a refresh callback if provided
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close and transition");
    }
  };

  if (!isOpen || !actionId) return null;

  const action = actionDetail?.action;

  return (
    <div
      data-testid="action-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        data-testid="modal-backdrop"
        className="fixed inset-0"
        onClick={onClose}
      ></div>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && (
          <div className="p-6 text-center text-zinc-600">Loading...</div>
        )}

        {error && (
          <div className="p-6">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          </div>
        )}

        {action && !loading && (
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              {/* Relationship Name at Top */}
              {action.leads && (
                <div className="mb-4 pb-4 border-b border-zinc-200">
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {action.leads.name}
                  </h3>
                  {action.leads.linkedin_url && (
                    <a
                      href={action.leads.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                    >
                      View LinkedIn →
                    </a>
                  )}
                  {action.leads.email && (
                    <a
                      href={`mailto:${action.leads.email}`}
                      className="text-sm text-blue-600 hover:text-blue-800 mt-1 ml-3 inline-block"
                    >
                      Email →
                    </a>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 data-testid="action-title" className="text-2xl font-semibold text-zinc-900">
                    {action.description || getActionTypeLabel(action.action_type)}
                  </h2>
                  <div className="mt-2 flex items-center gap-2">
                    <span data-testid="action-type" className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800">
                      {getActionTypeLabel(action.action_type)}
                    </span>
                    <span data-testid="action-state" className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800">
                      {getStateLabel(action.state)}
                    </span>
                  </div>
                </div>
              <button
                data-testid="modal-close"
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-600"
                aria-label="Close"
              >
                <svg
                  className="h-6 w-6"
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

            {/* Action Details */}
            <div className="mb-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-zinc-700 mb-2">Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Due Date:</span>
                    <span className="text-zinc-900">
                      {formatDateForDisplay(action.due_date)}
                    </span>
                  </div>
                  {action.created_at && (
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Created:</span>
                      <span className="text-zinc-900">
                        {new Date(action.created_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {action.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Completed:</span>
                      <span className="text-zinc-900">
                        {new Date(action.completed_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {action.auto_created && (
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Auto-created:</span>
                      <span className="text-zinc-900">Yes</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Deal Progression removed from UI per NEX-51 (kept in database) */}

              {/* Relationship State Machine */}
              {action.leads && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-700 mb-2">
                    Relationship State
                  </h3>
                  <div className="text-sm">
                    {action.leads.relationship_state ? (
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
                          {action.leads.relationship_state.replace(/_/g, " ")}
                        </span>
                        {action.leads.state_updated_at && (
                          <span className="text-zinc-500 text-xs">
                            Updated {formatDistanceToNow(new Date(action.leads.state_updated_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-xs">State not yet determined</span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Relationship Notes */}
              {action.leads && action.leads.notes && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-700 mb-2">
                    Relationship Notes
                  </h3>
                  <p className="text-sm text-zinc-600 whitespace-pre-wrap">
                    {action.leads.notes}
                  </p>
                </div>
              )}

              {/* Notes */}
              {action.notes && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-700 mb-2">
                    Notes
                  </h3>
                  <p className="text-sm text-zinc-900 whitespace-pre-wrap">
                    {action.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Action History */}
            {action.history && action.history.length > 0 && (
              <div data-testid="action-history" className="mb-6">
                <h3 className="text-sm font-medium text-zinc-700 mb-3">
                  History
                </h3>
                <div className="space-y-2">
                  {action.history.map((event, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 text-sm border-l-2 border-zinc-200 pl-3 py-2"
                    >
                      <div className="flex-1">
                        <div className="text-zinc-900 font-medium">
                          {event.event}
                        </div>
                        <div className="text-zinc-600 text-xs mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                      {event.state && (
                        <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-800">
                          {getStateLabel(event.state)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Actions */}
            {action.relatedActions && action.relatedActions.length > 0 ? (
              <div data-testid="related-actions" className="mb-6">
                <h3 className="text-sm font-medium text-zinc-700 mb-3">
                  Related Actions
                </h3>
                <div className="space-y-2">
                  {action.relatedActions.map((relatedAction) => (
                    <button
                      key={relatedAction.id}
                      onClick={() => {
                        if (onActionClick) {
                          onActionClick(relatedAction.id);
                        }
                        onClose();
                      }}
                      className="w-full text-left p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-zinc-900">
                            {relatedAction.description ||
                              getActionTypeLabel(relatedAction.action_type)}
                          </div>
                          <div className="text-xs text-zinc-600 mt-1">
                            {getActionTypeLabel(relatedAction.action_type)} •{" "}
                            {getStateLabel(relatedAction.state)} • Due{" "}
                            {formatDateForDisplay(relatedAction.due_date)}
                          </div>
                        </div>
                        <svg
                          className="h-5 w-5 text-zinc-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div data-testid="related-actions" className="mb-6">
                <h3 className="text-sm font-medium text-zinc-700 mb-3">
                  Related Actions
                </h3>
                <p className="text-sm text-zinc-600">No related actions</p>
              </div>
            )}

            {/* Completion Tracking */}
            <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="mb-3 text-sm font-medium text-zinc-700">
                Track Completion Events
              </h3>
              <div className="space-y-2">
                {!action.next_call_calendared_at && (
                  <button
                    onClick={() => handleTrackEvent("next_call_calendared")}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    ✓ Next call calendared
                  </button>
                )}
                {!action.replied_to_email_at && (
                  <button
                    onClick={() => handleTrackEvent("replied_to_email")}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    ✓ Replied to email with topics
                  </button>
                )}
                {!action.got_response_at && (
                  <button
                    onClick={() => handleTrackEvent("got_response")}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    ✓ Got response
                  </button>
                )}
                {action.next_call_calendared_at && (
                  <div className="text-xs text-zinc-600">
                    ✓ Next call calendared: {new Date(action.next_call_calendared_at).toLocaleString()}
                  </div>
                )}
                {action.replied_to_email_at && (
                  <div className="text-xs text-zinc-600">
                    ✓ Replied to email: {new Date(action.replied_to_email_at).toLocaleString()}
                  </div>
                )}
                {action.got_response_at && (
                  <div className="text-xs text-zinc-600">
                    ✓ Got response: {new Date(action.got_response_at).toLocaleString()}
                    {action.got_response_notes && (
                      <div className="mt-1 text-zinc-700">{action.got_response_notes}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
              <button
                onClick={onClose}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseAndTransition}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Close & Transition
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

