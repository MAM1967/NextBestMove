"use client";

import { PinFilter } from "./page";

interface PinFilterToggleProps {
  currentFilter: PinFilter;
  onFilterChange: (filter: PinFilter) => void;
}

export function PinFilterToggle({
  currentFilter,
  onFilterChange,
}: PinFilterToggleProps) {
  const filters: { value: PinFilter; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "ACTIVE", label: "Active" },
    { value: "SNOOZED", label: "Snoozed" },
    { value: "ARCHIVED", label: "Archived" },
  ];

  return (
    <div className="inline-flex rounded-lg bg-zinc-100 p-1">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            currentFilter === filter.value
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}




