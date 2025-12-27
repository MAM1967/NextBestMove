"use client";

import { Action } from "./types";

interface FollowUpFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: Action | null;
  onSchedule: () => void;
  onSnooze: () => void;
  onComplete: () => void;
  onAddNote: () => void;
}

export function FollowUpFlowModal({
  isOpen,
  onClose,
  action,
  onSchedule,
  onSnooze,
  onComplete,
  onAddNote,
}: FollowUpFlowModalProps) {
  if (!isOpen || !action) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">
            Got a reply — what&apos;s next?
          </h2>
          <button
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

        <div className="space-y-3">
          <button
            onClick={() => {
              onSchedule();
              onClose();
            }}
            className="w-full rounded-lg border-2 border-zinc-900 bg-zinc-50 p-4 text-left transition-colors hover:bg-zinc-100"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-semibold text-zinc-900">
                    Schedule follow-up
                  </strong>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                    Recommended
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Set a date to follow up on this conversation
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              onSnooze();
              onClose();
            }}
            className="w-full rounded-lg border border-zinc-200 bg-white p-4 text-left transition-colors hover:bg-zinc-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <strong className="text-sm font-semibold text-zinc-900">
                  Snooze
                </strong>
                <p className="mt-1 text-xs text-zinc-500">
                  Come back to this later
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              onComplete();
              onClose();
            }}
            className="w-full rounded-lg border border-zinc-200 bg-white p-4 text-left transition-colors hover:bg-zinc-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <strong className="text-sm font-semibold text-zinc-900">
                  Mark complete
                </strong>
                <p className="mt-1 text-xs text-zinc-500">
                  No further action needed
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-200">
          <button
            onClick={() => {
              onAddNote();
              onClose();
            }}
            className="text-sm text-zinc-600 hover:text-zinc-900"
          >
            Add note about this reply
          </button>
        </div>
      </div>
    </div>
  );
}














