"use client";

import { useState, useEffect } from "react";

interface EstimatedMinutesModalProps {
  actionId: string;
  currentMinutes: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (minutes: number | null) => Promise<void>;
}

/**
 * Modal for setting/editing estimated_minutes on an action
 */
export function EstimatedMinutesModal({
  actionId,
  currentMinutes,
  isOpen,
  onClose,
  onSave,
}: EstimatedMinutesModalProps) {
  const [minutes, setMinutes] = useState<string>(
    currentMinutes?.toString() || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMinutes(currentMinutes?.toString() || "");
      setError(null);
    }
  }, [isOpen, currentMinutes]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError(null);

    // Parse and validate
    let minutesValue: number | null = null;
    if (minutes.trim() !== "") {
      const parsed = parseInt(minutes.trim(), 10);
      if (isNaN(parsed) || parsed <= 0) {
        setError("Please enter a positive number");
        return;
      }
      minutesValue = parsed;
    }

    setIsSaving(true);
    try {
      await onSave(minutesValue);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickSelect = (value: number) => {
    setMinutes(value.toString());
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          Set Time Estimate
        </h2>

        <p className="text-sm text-zinc-600 mb-4">
          How long will this action take? This helps the &quot;I have X minutes&quot;
          selector find the right action for your schedule.
        </p>

        <div className="mb-4">
          <label
            htmlFor="minutes"
            className="block text-sm font-medium text-zinc-700 mb-2"
          >
            Estimated minutes
          </label>

          {/* Quick select buttons */}
          <div className="flex gap-2 mb-3">
            {[5, 10, 15, 30].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleQuickSelect(value)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  minutes === value.toString()
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {value} min
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setMinutes("");
                setError(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                minutes === ""
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              Clear
            </button>
          </div>

          <input
            id="minutes"
            type="number"
            min="1"
            value={minutes}
            onChange={(e) => {
              setMinutes(e.target.value);
              setError(null);
            }}
            placeholder="Enter minutes (e.g., 5, 10, 15)"
            className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

