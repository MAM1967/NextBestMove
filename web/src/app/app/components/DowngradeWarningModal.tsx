"use client";

import { useState } from "react";

interface DowngradeWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPinCount: number;
  onAcknowledge: () => void;
}

export function DowngradeWarningModal({
  isOpen,
  onClose,
  currentPinCount,
  onAcknowledge,
}: DowngradeWarningModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleAcknowledge = async () => {
    setIsLoading(true);
    try {
      // Mark warning as shown in subscription metadata
      await fetch("/api/billing/acknowledge-downgrade-warning", {
        method: "POST",
      });
      onAcknowledge();
    } catch (error) {
      console.error("Error acknowledging downgrade warning:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const pinsToArchive = currentPinCount - 50;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
          disabled={isLoading}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Warning Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <svg
            className="h-6 w-6 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold text-zinc-900">
            Plan Downgrade Notice
          </h3>
          <p className="mt-2 text-sm text-zinc-600">
            You&apos;ve downgraded to the Standard plan, which includes up to 50
            pins. You currently have <strong>{currentPinCount} active pins</strong>.
          </p>
        </div>

        {/* Warning Box */}
        <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800">
            Action Required
          </p>
          <p className="mt-1 text-sm text-yellow-700">
            To continue using the Standard plan, you&apos;ll need to archive or
            snooze at least <strong>{pinsToArchive} pin{pinsToArchive !== 1 ? "s" : ""}</strong> to
            get below the 50 pin limit.
          </p>
        </div>

        {/* Options */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleAcknowledge}
            disabled={isLoading}
            className="w-full rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "I Understand"}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full rounded-full border border-zinc-300 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            Manage Pins Now
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-500">
          You can upgrade back to Professional anytime to restore unlimited
          pins.
        </p>
      </div>
    </div>
  );
}

