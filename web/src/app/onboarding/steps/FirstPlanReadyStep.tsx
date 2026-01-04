"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface FirstPlanReadyStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function FirstPlanReadyStep({
  onNext,
  onBack,
}: FirstPlanReadyStepProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-generate plan when step loads
    generatePlan();
  }, []);

  const generatePlan = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch("/api/daily-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today }),
      });

      const data = await response.json();

      // Handle graceful error response (status 200 with success: false)
      if (!response.ok || (data.success === false && !data.allowContinue)) {
        throw new Error(data.error || "Failed to generate plan");
      }

      // If plan generated successfully
      if (data.success === true) {
        setPlanGenerated(true);
        router.refresh();
      } else if (data.success === false && data.allowContinue) {
        // Graceful error - user can continue
        setError(
          data.error || "Could not generate plan. You can continue without it."
        );
        // Don't block progression - user can still continue
      }
    } catch (error) {
      // Network errors, JSON parse errors, etc.
      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate plan. You can generate it later from the Daily Plan page."
      );
      // Don't block progression on errors - user can continue
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="space-y-6 text-center">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">
            Generating your first daily plan...
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            We&apos;re creating a personalized plan based on your pins and
            schedule.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">
            Plan Generation
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            {error}
          </p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 flex-shrink-0 text-yellow-600"
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
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Don&apos;t worry!
              </p>
              <p className="mt-1 text-sm text-yellow-700">
                You can generate your first plan from the Daily Plan page anytime.
                You can continue with onboarding now.
              </p>
            </div>
          </div>
        </div>
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
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900">
          Your first daily plan is ready!
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          We&apos;ve created your first daily plan with up to 3 actions to
          ensure an early win.
        </p>
      </div>

      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-3">
          <svg
            className="h-5 w-5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p className="text-sm font-medium text-green-900">
            Plan generated successfully
          </p>
        </div>
        <p className="mt-2 text-xs text-green-800">
          Your plan includes one Fast Win action to get you started quickly.
        </p>
      </div>

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
          Continue
        </button>
      </div>
    </div>
  );
}

