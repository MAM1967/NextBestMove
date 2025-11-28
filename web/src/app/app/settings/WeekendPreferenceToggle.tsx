"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type WeekendPreferenceToggleProps = {
  excludeWeekends: boolean;
};

export function WeekendPreferenceToggle({
  excludeWeekends: initialValue,
}: WeekendPreferenceToggleProps) {
  const router = useRouter();
  const [excludeWeekends, setExcludeWeekends] = useState(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (value: boolean) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/users/weekend-preference", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exclude_weekends: value }),
      });

      if (!response.ok) {
        throw new Error("Failed to update weekend preference");
      }

      setExcludeWeekends(value);
      // Refresh to show updated state
      router.refresh();
    } catch (error) {
      console.error("Error updating weekend preference:", error);
      alert("Failed to update weekend preference. Please try again.");
      // Revert to previous value
      setExcludeWeekends(!value);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-900">
          Exclude weekends from daily plans
        </p>
        <p className="mt-0.5 text-xs text-zinc-600">
          When enabled, Saturday and Sunday will not generate daily plans. This
          is useful if you don&apos;t work on weekends.
        </p>
      </div>
      <button
        type="button"
        onClick={() => handleToggle(!excludeWeekends)}
        disabled={isUpdating}
        className={`relative ml-4 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 ${
          excludeWeekends ? "bg-purple-600" : "bg-zinc-200"
        }`}
        role="switch"
        aria-checked={excludeWeekends}
        aria-label="Exclude weekends from daily plans"
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            excludeWeekends ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

