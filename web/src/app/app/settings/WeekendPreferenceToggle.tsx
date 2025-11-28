"use client";

import { useState } from "react";
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

  const handleToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isUpdating) return;
    
    const newValue = !excludeWeekends;
    setIsUpdating(true);
    const previousValue = excludeWeekends;
    
    // Optimistic update
    setExcludeWeekends(newValue);
    
    try {
      const response = await fetch("/api/users/weekend-preference", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exclude_weekends: newValue }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update weekend preference");
      }

      // Success - refresh to get latest state
      router.refresh();
    } catch (error) {
      console.error("Error updating weekend preference:", error);
      // Revert on error
      setExcludeWeekends(previousValue);
      alert("Failed to update weekend preference. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-900">
          Skip weekend planning
        </p>
        <p className="mt-0.5 text-xs text-zinc-600">
          Exclude Saturday and Sunday from daily plan generation
        </p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isUpdating}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          excludeWeekends ? "bg-purple-600" : "bg-zinc-300"
        }`}
        role="switch"
        aria-checked={excludeWeekends}
        aria-label="Skip weekend planning"
      >
        <span
          className={`pointer-events-none absolute top-0.5 left-0.5 inline-block h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
            excludeWeekends ? "translate-x-5" : "translate-x-0"
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
