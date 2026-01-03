"use client";

import { useState, useEffect } from "react";
import type { CapacityLevel } from "@/lib/plan/capacity";
import { capacityLabels, getCapacityLabel } from "@/lib/plan/capacity-labels";

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
  const [todayCapacity, setTodayCapacity] = useState<{
    capacity: CapacityLevel | null;
    reason: string | null;
  } | null>(null);

  useEffect(() => {
    setDefaultCapacity(initialDefault || null);
  }, [initialDefault]);

  // Fetch today's actual capacity being used
  useEffect(() => {
    async function fetchTodayCapacity() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const response = await fetch(`/api/plan/capacity-override?date=${today}`);
        if (response.ok) {
          const data = (await response.json()) as {
            dailyOverride?: CapacityLevel | null;
            defaultOverride?: CapacityLevel | null;
          };
          
          // Get today's daily plan to see actual capacity being used
          const planResponse = await fetch(`/api/daily-plans?date=${today}`);
          if (planResponse.ok) {
            const planData = await planResponse.json();
            const actualCapacity = planData.dailyPlan?.capacity as CapacityLevel | null;
            
            // Determine effective capacity (same logic as Daily Plan page)
            const effectiveCapacity = data.dailyOverride || 
              (actualCapacity && actualCapacity !== "default" ? actualCapacity : null);
            
            // Determine reason
            let reason: string | null = null;
            if (data.dailyOverride) {
              reason = "manual override";
            } else if (actualCapacity && actualCapacity !== "default" && data.defaultOverride !== actualCapacity) {
              if (actualCapacity === "micro" || actualCapacity === "light") {
                reason = "adaptive recovery";
              } else {
                reason = "calendar-based";
              }
            } else if (data.defaultOverride) {
              reason = "your default setting";
            } else {
              reason = "calendar-based";
            }
            
            setTodayCapacity({
              capacity: effectiveCapacity,
              reason,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch today's capacity:", err);
      }
    }
    
    fetchTodayCapacity();
  }, []);

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
          // Show today's effective capacity as selected if it differs from default
          const isSelected = todayCapacity && todayCapacity.capacity !== defaultCapacity
            ? todayCapacity.capacity === option.value
            : defaultCapacity === option.value;
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
      
      {/* Show note if today's capacity differs from default */}
      {todayCapacity && todayCapacity.capacity !== defaultCapacity && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
          <p className="text-sm text-blue-900">
            <span className="font-medium">Currently using:</span>{" "}
            <span className="font-semibold">
              {getCapacityLabel(todayCapacity.capacity)}
            </span>
            {todayCapacity.reason && (
              <span className="text-blue-700"> ({todayCapacity.reason})</span>
            )}
            {" "}instead of your default setting above.
          </p>
          <p className="mt-1 text-xs text-blue-700">
            This matches what you see on your Daily Plan page. Your default setting will be used when no override or adaptive recovery applies.
          </p>
        </div>
      )}
    </div>
  );
}

