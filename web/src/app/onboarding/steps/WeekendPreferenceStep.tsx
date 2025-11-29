"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface WeekendPreferenceStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function WeekendPreferenceStep({
  onNext,
  onBack,
  onSkip,
}: WeekendPreferenceStepProps) {
  const router = useRouter();
  const [excludeWeekends, setExcludeWeekends] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/users/weekend-preference", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exclude_weekends: excludeWeekends }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save preference");
      }

      router.refresh();
      onNext();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save preference"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900">
          Do you work on weekends?
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          I can exclude Saturday and Sunday from daily plan generation if you
          don&apos;t work weekends.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <label className="flex cursor-pointer items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-900">
              Exclude weekends from daily plans
            </p>
            <p className="mt-0.5 text-xs text-zinc-600">
              Saturday and Sunday will be skipped when generating your daily
              plans
            </p>
          </div>
          <input
            type="checkbox"
            checked={excludeWeekends}
            onChange={(e) => setExcludeWeekends(e.target.checked)}
            disabled={isSaving}
            className="ml-4 h-5 w-5 cursor-pointer rounded border-2 border-zinc-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>
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
          disabled={isSaving}
          className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={isSaving}
          className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}

