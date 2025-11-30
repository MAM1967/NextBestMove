"use client";

import Link from "next/link";
import { useState } from "react";

type GracePeriodBannerProps = {
  daysRemaining: number;
};

export function GracePeriodBanner({ daysRemaining }: GracePeriodBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900 mb-1">
            Your trial has ended
          </h3>
          <p className="text-sm text-amber-800 mb-3">
            {daysRemaining > 0
              ? `You have ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left to subscribe and keep your rhythm going. Your data is safe.`
              : "Subscribe to resume your rhythm. Your data is safe and nothing is lost."}
          </p>
          <Link
            href="/app/settings"
            className="inline-block rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition"
          >
            Subscribe Now
          </Link>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-amber-600 hover:text-amber-800 transition"
          aria-label="Dismiss banner"
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
      </div>
    </div>
  );
}

