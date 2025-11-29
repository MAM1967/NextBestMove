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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate plan");
      }

      setPlanGenerated(true);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate plan. You can generate it later."
      );
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
          <p className="text-sm text-yellow-800">
            Don&apos;t worry! You can generate your first plan from the Daily
            Plan page anytime.
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

