"use client";

import { useState, useEffect, FormEvent } from "react";
import { calculateEOD, calculateEndOfWeek } from "@/lib/utils/promiseUtils";

interface PromiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionId: string | null;
  currentPromise?: string | null;
  userTimeZone?: string;
  workEndTime?: string | null;
  onSetPromise: (actionId: string, promisedDueAt: string | null) => Promise<void>;
}

export function PromiseModal({
  isOpen,
  onClose,
  actionId,
  currentPromise,
  userTimeZone = "America/New_York",
  workEndTime = null,
  onSetPromise,
}: PromiseModalProps) {
  const [promiseOption, setPromiseOption] = useState<"eod" | "end_of_week" | "custom" | "none">(
    currentPromise ? "custom" : "eod"
  );
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default custom date if editing existing promise
  useEffect(() => {
    if (isOpen && actionId) {
      if (currentPromise) {
        const promiseDate = new Date(currentPromise);
        setCustomDate(promiseDate.toISOString().split("T")[0]);
        const hours = promiseDate.getHours().toString().padStart(2, "0");
        const minutes = promiseDate.getMinutes().toString().padStart(2, "0");
        setCustomTime(`${hours}:${minutes}`);
        setPromiseOption("custom");
      } else {
        // Default to EOD today
        setPromiseOption("eod");
        setCustomDate("");
        setCustomTime("");
      }
      setError(null);
    }
  }, [isOpen, actionId, currentPromise]);

  if (!isOpen || !actionId) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    let promisedDueAt: string | null = null;

    if (promiseOption === "none") {
      // Clear promise
      promisedDueAt = null;
    } else if (promiseOption === "eod") {
      // Set to EOD today
      const eod = calculateEOD(userTimeZone, workEndTime);
      promisedDueAt = eod.toISOString();
    } else if (promiseOption === "end_of_week") {
      // Set to end of week (Sunday EOD)
      const endOfWeek = calculateEndOfWeek(userTimeZone, workEndTime);
      promisedDueAt = endOfWeek.toISOString();
    } else if (promiseOption === "custom") {
      // Custom date and time
      if (!customDate) {
        setError("Please select a date");
        return;
      }
      
      // Combine date and time, default to EOD if no time provided
      let dateTimeStr = customDate;
      if (customTime) {
        dateTimeStr = `${customDate}T${customTime}:00`;
      } else {
        // Use EOD time if no custom time
        const eod = calculateEOD(userTimeZone, workEndTime);
        const hours = eod.getHours().toString().padStart(2, "0");
        const minutes = eod.getMinutes().toString().padStart(2, "0");
        dateTimeStr = `${customDate}T${hours}:${minutes}:00`;
      }
      
      // Create date in user's timezone and convert to ISO
      const userDate = new Date(dateTimeStr);
      promisedDueAt = userDate.toISOString();
    }

    setLoading(true);
    try {
      await onSetPromise(actionId, promisedDueAt);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to set promise. Please try again."
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
            {currentPromise ? "Update Promise" : "Mark as Promised"}
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
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-900">
              When did you promise this?
            </label>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="promise-option"
                  value="eod"
                  checked={promiseOption === "eod"}
                  onChange={() => setPromiseOption("eod")}
                  className="text-purple-600"
                />
                <span className="text-sm text-zinc-700">By end of today (EOD)</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="promise-option"
                  value="end_of_week"
                  checked={promiseOption === "end_of_week"}
                  onChange={() => setPromiseOption("end_of_week")}
                  className="text-purple-600"
                />
                <span className="text-sm text-zinc-700">By end of this week (Sunday EOD)</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="promise-option"
                  value="custom"
                  checked={promiseOption === "custom"}
                  onChange={() => setPromiseOption("custom")}
                  className="text-purple-600"
                />
                <span className="text-sm text-zinc-700">By specific date</span>
              </label>
              
              {currentPromise && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="promise-option"
                    value="none"
                    checked={promiseOption === "none"}
                    onChange={() => setPromiseOption("none")}
                    className="text-purple-600"
                  />
                  <span className="text-sm text-zinc-700">Remove promise</span>
                </label>
              )}
            </div>
          </div>

          {promiseOption === "custom" && (
            <div className="space-y-2">
              <div>
                <label
                  htmlFor="promise-date"
                  className="block text-sm font-medium text-zinc-900"
                >
                  Date
                </label>
                <input
                  id="promise-date"
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  required={promiseOption === "custom"}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label
                  htmlFor="promise-time"
                  className="block text-sm font-medium text-zinc-900"
                >
                  Time (optional, defaults to end of workday)
                </label>
                <input
                  id="promise-time"
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

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
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : promiseOption === "none"
                ? "Remove Promise"
                : "Save Promise"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




