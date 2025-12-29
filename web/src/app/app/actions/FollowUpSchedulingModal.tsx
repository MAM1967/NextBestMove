"use client";

import { useState, useEffect, FormEvent } from "react";

interface FollowUpSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionId: string | null;
  onSchedule: (actionId: string, followUpDate: string, note?: string) => Promise<void>;
}

export function FollowUpSchedulingModal({
  isOpen,
  onClose,
  actionId,
  onSchedule,
}: FollowUpSchedulingModalProps) {
  const [followUpDate, setFollowUpDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default to 3 days from now (common follow-up default)
  useEffect(() => {
    if (isOpen && actionId) {
      const date = new Date();
      date.setDate(date.getDate() + 3);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Modal reset pattern
      setFollowUpDate(date.toISOString().split("T")[0]);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Modal reset pattern
      setNote("");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Modal reset pattern
      setError(null);
    }
  }, [isOpen, actionId]);

  if (!isOpen || !actionId) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!followUpDate) {
      setError("Please select a date");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSchedule(actionId, followUpDate, note.trim() || undefined);
      // Close modal on success - don't set loading to false as modal will unmount
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to schedule follow-up. Please try again."
      );
      setLoading(false);
    }
  };

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
            Schedule Follow-Up
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="follow-up-date"
              className="block text-sm font-medium text-zinc-900"
            >
              Follow-up date
            </label>
            <input
              id="follow-up-date"
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              required
            />
            <p className="mt-1 text-xs text-zinc-500">
              When should you follow up on this conversation?
            </p>
          </div>

          <div>
            <label
              htmlFor="follow-up-note"
              className="block text-sm font-medium text-zinc-900"
            >
              Note (optional)
            </label>
            <textarea
              id="follow-up-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder="Add context about this reply or what to follow up on..."
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Scheduling..." : "Schedule Follow-Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

