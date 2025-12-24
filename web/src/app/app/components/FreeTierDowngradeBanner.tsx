"use client";

import Link from "next/link";
import { getTierInfo } from "@/lib/billing/tier-labels";

/**
 * FreeTierDowngradeBanner component
 * 
 * Shows a banner when a user has been downgraded from Standard trial to Free tier (Day 15).
 * This explains what changed and provides an upgrade CTA.
 */
export function FreeTierDowngradeBanner() {
  const freeTierInfo = getTierInfo("free");
  const standardTierInfo = getTierInfo("standard");

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4" data-free-tier-banner data-testid="free-tier-banner">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-amber-900">
              Your Standard trial has ended
            </h3>
          </div>
          <p className="text-sm text-amber-800 mb-3">
            You're now on <strong>{freeTierInfo.name} - {freeTierInfo.tagline}</strong>. 
            You can still use manual planning and basic features, but automatic daily plans 
            and calendar-aware capacity require <strong>{standardTierInfo.name} - {standardTierInfo.tagline}</strong>.
          </p>
          <Link
            href="/app/settings"
            className="inline-flex items-center rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
          >
            Upgrade to Standard →
          </Link>
        </div>
        <button
          type="button"
          className="text-amber-600 hover:text-amber-800"
          aria-label="Dismiss banner"
          onClick={() => {
            // Store dismissal in localStorage to hide banner for session
            if (typeof window !== "undefined") {
              localStorage.setItem("free_tier_banner_dismissed", new Date().toISOString());
              // Trigger a re-render by updating a dummy state or using a state management solution
              // For now, just hide it - in a real implementation, use state management
              const banner = document.querySelector('[data-free-tier-banner]');
              if (banner) {
                (banner as HTMLElement).style.display = "none";
              }
            }
          }}
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

