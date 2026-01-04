"use client";

import { useState, useEffect } from "react";
import type { CapacityLevel } from "@/lib/plan/capacity";
import { capacityLabels } from "@/lib/plan/capacity-labels";

interface CapacityOverrideControlProps {
  date: string;
  currentOverride?: CapacityLevel | null;
  currentOverrideReason?: string | null;
  onOverrideChange?: () => void;
  showLabel?: boolean;
  compact?: boolean;
}

export function CapacityOverrideControl({
  date,
  currentOverride,
  currentOverrideReason,
  onOverrideChange,
  showLabel = true,
  compact = false,
}: CapacityOverrideControlProps) {
  const [override, setOverride] = useState<CapacityLevel | null>(
    currentOverride || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOverride(currentOverride || null);
  }, [currentOverride]);

  const capacityOptions: Array<{
    value: CapacityLevel | null;
    label: string;
    description: string;
    reason?: string;
  }> = [
    {
      value: null,
      label: capacityLabels.auto.label,
      description: capacityLabels.auto.description,
    },
    {
      value: "micro",
      label: capacityLabels.micro.label,
      description: capacityLabels.micro.description,
      reason: "busy",
    },
    {
      value: "light",
      label: capacityLabels.light.label,
      description: capacityLabels.light.description,
      reason: "light",
    },
    {
      value: "standard",
      label: capacityLabels.standard.label,
      description: capacityLabels.standard.description,
      reason: "manual",
    },
    {
      value: "heavy",
      label: capacityLabels.heavy.label,
      description: capacityLabels.heavy.description,
      reason: "manual",
    },
  ];

  const handleSetOverride = async (capacity: CapacityLevel | null) => {
    setLoading(true);
    setError(null);

    try {
      if (capacity === null) {
        // Remove override
        const response = await fetch(
          `/api/plan/capacity-override?date=${date}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Failed to remove override");
        }
      } else {
        // Set override
        const option = capacityOptions.find((opt) => opt.value === capacity);
        const response = await fetch("/api/plan/capacity-override", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date,
            capacity,
            reason: option?.reason || "manual",
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Failed to set override");
        }
      }

      setOverride(capacity);
      if (onOverrideChange) {
        onOverrideChange();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update capacity"
      );
      console.error("Error setting capacity override:", err);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {showLabel && (
          <span className="text-sm font-medium text-zinc-700">Capacity:</span>
        )}
        <select
          value={override || ""}
          onChange={(e) => {
            const value = e.target.value;
            handleSetOverride(
              value === "" ? null : (value as CapacityLevel)
            );
          }}
          disabled={loading}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
        >
          {capacityOptions.map((option) => (
            <option key={option.value || "auto"} value={option.value || ""}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <span className="text-xs text-red-600">{error}</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <label className="text-sm font-medium text-zinc-900">
          Daily Capacity
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {capacityOptions.map((option) => {
          const isSelected = override === option.value;
          return (
            <button
              key={option.value || "auto"}
              type="button"
              onClick={() => handleSetOverride(option.value)}
              disabled={loading}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                isSelected
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
              } disabled:opacity-50`}
            >
              <div className="text-left">
                <div className="font-semibold">{option.label}</div>
                <div className="text-xs text-zinc-500">
                  {option.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {currentOverrideReason && (
        <p className="text-xs text-zinc-500">
          Override reason: {currentOverrideReason}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

