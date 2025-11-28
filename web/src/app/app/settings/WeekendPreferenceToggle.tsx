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

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isUpdating) return;
    
    const newValue = e.target.checked;
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
      <label className="flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={excludeWeekends}
          onChange={handleToggle}
          disabled={isUpdating}
          className="h-5 w-5 cursor-pointer rounded border-2 border-zinc-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span className="ml-3 text-sm font-medium text-zinc-700">
          {excludeWeekends ? "Enabled" : "Disabled"}
        </span>
      </label>
    </div>
  );
}
