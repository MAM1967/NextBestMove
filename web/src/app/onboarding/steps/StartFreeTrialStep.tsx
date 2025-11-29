"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StartFreeTrialStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function StartFreeTrialStep({
  onNext,
  onBack,
}: StartFreeTrialStepProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartTrial = async () => {
    setIsStarting(true);
    setError(null);

    try {
      // Start trial directly (no payment required, no checkout redirect)
      const response = await fetch("/api/billing/start-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "standard",
          interval: "month",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || "Failed to start trial");
      }

      // Trial started successfully - complete onboarding and redirect to app
      const result = await response.json();
      if (result.success) {
        // Mark onboarding as completed
        const completeResponse = await fetch("/api/users/complete-onboarding", {
          method: "POST",
        });
        
        if (completeResponse.ok) {
          // Redirect to app
          router.push("/app");
          router.refresh();
        } else {
          // Still redirect even if completion fails
          router.push("/app");
        }
      } else {
        throw new Error("Trial creation did not succeed");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to start trial. Please try again."
      );
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900">
          Start your 14-day free trial
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          No credit card required. Get full access to all features for 14 days.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-zinc-900">
              Full access to all features
            </p>
            <p className="mt-0.5 text-xs text-zinc-600">
              Daily plans, pins, actions, weekly summaries, and more
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-zinc-900">
              No credit card required
            </p>
            <p className="mt-0.5 text-xs text-zinc-600">
              Start using NextBestMove immediately, no payment needed
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-zinc-900">
              Add pins and actions to get started
            </p>
            <p className="mt-0.5 text-xs text-zinc-600">
              After starting your trial, add more pins and actions to see your
              first daily plan
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isStarting}
          className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleStartTrial}
          disabled={isStarting}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {isStarting ? "Starting trial..." : "Start Free Trial"}
        </button>
      </div>
    </div>
  );
}

