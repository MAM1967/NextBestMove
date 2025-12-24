"use client";

import type { LeadFilter } from "@/lib/leads/types";

interface LeadFilterToggleProps {
  currentFilter: LeadFilter;
  onFilterChange: (filter: LeadFilter) => void;
}

export function LeadFilterToggle({
  currentFilter,
  onFilterChange,
}: LeadFilterToggleProps) {
  const filters: { value: LeadFilter; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "ACTIVE", label: "Active" },
    { value: "SNOOZED", label: "Snoozed" },
    { value: "ARCHIVED", label: "Archived" },
  ];

  return (
    <div className="inline-flex rounded-lg bg-zinc-100 p-1" data-testid="relationship-filter-toggle">
      {filters.map((filter) => (
        <button
          key={filter.value}
          data-testid={`filter-${filter.value.toLowerCase()}`}
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

