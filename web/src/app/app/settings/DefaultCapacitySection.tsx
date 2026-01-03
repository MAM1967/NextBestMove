"use client";

import { useState, useEffect } from "react";
import type { CapacityLevel } from "@/lib/plan/capacity";
import { capacityLabels } from "@/lib/plan/capacity-labels";

interface DefaultCapacitySectionProps {
  initialDefault?: CapacityLevel | null;
}

export function DefaultCapacitySection({
  initialDefault,
}: DefaultCapacitySectionProps) {
  const [defaultCapacity, setDefaultCapacity] = useState<CapacityLevel | null>(
    initialDefault || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setDefaultCapacity(initialDefault || null);
  }, [initialDefault]);

  const capacityOptions: Array<{
    value: CapacityLevel | null;
    label: string;
    description: string;
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
    },
    {
      value: "light",
      label: capacityLabels.light.label,
      description: capacityLabels.light.description,
    },
    {
      value: "standard",
      label: capacityLabels.standard.label,
      description: capacityLabels.standard.description,
    },
    {
      value: "heavy",
      label: capacityLabels.heavy.label,
      description: capacityLabels.heavy.description,
    },
  ];

  const handleUpdate = async (capacity: CapacityLevel | null) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/user/default-capacity", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          default_capacity_override: capacity,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to update default capacity");
      }

      setDefaultCapacity(capacity);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update default capacity"
      );
      console.error("Error updating default capacity:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-zinc-900">
          Default daily capacity
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Set your default capacity preference. This is used when no calendar
          data is available and no daily override is set.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {capacityOptions.map((option) => {
          const isSelected = defaultCapacity === option.value;
          return (
            <button
              key={option.value || "auto"}
              type="button"
              onClick={() => handleUpdate(option.value)}
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

      {success && (
        <p className="text-sm text-green-600">Default capacity updated!</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

