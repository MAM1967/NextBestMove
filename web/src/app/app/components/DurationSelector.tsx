"use client";

/**
 * DurationSelector component
 * 
 * Allows users to filter the best action by estimated duration (5, 10, or 15 minutes).
 * When a duration is selected, only actions with estimated_minutes <= selected duration are shown.
 */
export function DurationSelector({
  selectedDuration,
  onDurationChange,
}: {
  selectedDuration: number | null;
  onDurationChange: (duration: number | null) => void;
}) {
  const durations = [5, 10, 15] as const;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">I have:</span>
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
        <button
          type="button"
          onClick={() => onDurationChange(null)}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            selectedDuration === null
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Any
        </button>
        {durations.map((duration) => (
          <button
            key={duration}
            type="button"
            onClick={() => onDurationChange(duration)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              selectedDuration === duration
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {duration} min
          </button>
        ))}
      </div>
    </div>
  );
}
