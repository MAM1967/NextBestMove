"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface FastWinCoachingStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function FastWinCoachingStep({
  onNext,
  onBack,
}: FastWinCoachingStepProps) {
  const router = useRouter();
  const [hasFastWin, setHasFastWin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if there's a Fast Win in today's plan
    const checkFastWin = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const response = await fetch(`/api/daily-plans?date=${today}`);
        if (response.ok) {
          const data = await response.json();
          // Check if plan has a fast win action
          if (data.plan?.actions) {
            const hasFastWinAction = data.plan.actions.some(
              (action: any) => action.is_fast_win === true
            );
            setHasFastWin(hasFastWinAction);
          }
        }
      } catch (error) {
        console.error("Error checking fast win:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkFastWin();
  }, []);

  if (isChecking) {
    return (
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900">
          Complete your Fast Win
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Fast Wins are quick actions (under 5 minutes) that have high impact.
          Let&apos;s complete your first one!
        </p>
      </div>

      {hasFastWin ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-purple-900">
                  You have a Fast Win in your plan!
                </p>
                <p className="mt-1 text-xs text-purple-800">
                  Go to your Daily Plan page to see it and mark it as done when
                  you&apos;re finished.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-medium text-zinc-900">Tips for success:</p>
            <ul className="space-y-1 text-xs text-zinc-600">
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>Fast Wins are designed to be quick and easy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>Complete them first to build momentum</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>Mark actions as &quot;Done&quot; when finished</span>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm text-zinc-600">
            Your plan is ready! You can view it on the Daily Plan page. Fast
            Wins will appear when available.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          Start using NextBestMove
        </button>
      </div>
    </div>
  );
}

