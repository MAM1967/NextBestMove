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
    
    console.log("Toggle clicked!", { excludeWeekends, isUpdating });
    
    if (isUpdating) {
      console.log("Already updating, ignoring click");
      return;
    }
    
    const newValue = !excludeWeekends;
    setIsUpdating(true);
    const previousValue = excludeWeekends;
    
    console.log("Setting new value:", newValue);
    
    // Optimistic update
    setExcludeWeekends(newValue);
    
    try {
      console.log("Making API call...");
      const response = await fetch("/api/users/weekend-preference", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exclude_weekends: newValue }),
      });

      console.log("API response:", response.status, response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update weekend preference");
      }

      console.log("Success! Refreshing...");
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
        onMouseDown={(e) => {
          console.log("Mouse down on button");
          e.preventDefault();
        }}
        disabled={isUpdating}
        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          backgroundColor: excludeWeekends ? "#9333ea" : "#e4e4e7",
          zIndex: 10,
          position: "relative",
        }}
        role="switch"
        aria-checked={excludeWeekends}
        aria-label="Skip weekend planning"
      >
        <span
          className="pointer-events-none absolute top-0.5 left-0.5 inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out"
          style={{
            transform: excludeWeekends ? "translateX(20px)" : "translateX(0px)",
          }}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
