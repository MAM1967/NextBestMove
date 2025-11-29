"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface WeeklyFocusStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function WeeklyFocusStep({
  onNext,
  onBack,
  onSkip,
}: WeeklyFocusStepProps) {
  const router = useRouter();
  const [focus, setFocus] = useState(
    "This week: follow up with 3 people and start 2 new conversations."
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // For now, we'll just store this in the user's mind/notes
      // In the future, we can store it in weekly_summaries or user preferences
      // For onboarding, we'll just continue - the focus will be set when they see their first weekly summary
      router.refresh();
      onNext();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save focus"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const suggestions = [
    "This week: follow up with 3 people and start 2 new conversations.",
    "This week: revive 3 warm threads and book at least 1 call.",
    "This week: build momentum with 4 solid days of action.",
    "This week: close 2 warm opportunities and start 5 new conversations.",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900">
          Set your weekly focus
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          What do you want to accomplish this week? You can edit this anytime.
        </p>
      </div>

      <div className="space-y-4">
        {!isEditing ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm text-zinc-900">{focus}</p>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="mt-2 text-xs font-medium text-purple-600 hover:text-purple-700"
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              rows={3}
              className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Enter your weekly focus..."
            />
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFocus(suggestion);
                    setIsEditing(false);
                  }}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  Use this
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
      </div>

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
          {isSaving ? "Saving..." : "Looks good"}
        </button>
      </div>
    </div>
  );
}

