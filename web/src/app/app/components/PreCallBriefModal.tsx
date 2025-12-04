"use client";

import { useEffect } from "react";
import type { PreCallBrief } from "@/lib/pre-call-briefs/types";

interface PreCallBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  brief: PreCallBrief | null;
}

export function PreCallBriefModal({
  isOpen,
  onClose,
  brief,
}: PreCallBriefModalProps) {
  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !brief) return null;

  const eventTime = new Date(brief.eventStart);
  const timeStr = eventTime.toLocaleTimeString("en-US", {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="mx-4 w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="border-b border-zinc-200 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Pre-Call Brief
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                {brief.eventTitle} • {timeStr}
              </p>
              {brief.personName && (
                <p className="mt-1 text-sm font-medium text-zinc-700">
                  with {brief.personName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600"
            >
              <svg
                className="h-6 w-6"
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
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm text-zinc-700">
              {brief.briefContent}
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-200 p-4">
          <button
            onClick={onClose}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

