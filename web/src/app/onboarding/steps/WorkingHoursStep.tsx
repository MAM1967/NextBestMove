"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatTime, convert24To12 } from "@/lib/utils/timeFormat";

interface WorkingHoursStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function WorkingHoursStep({
  onNext,
  onBack,
  onSkip,
}: WorkingHoursStepProps) {
  const router = useRouter();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("24h");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's time format preference
  useEffect(() => {
    const fetchTimeFormat = async () => {
      try {
        const response = await fetch("/api/billing/subscription");
        // We'll get time format from user profile if available
        // For now, default to 24h
      } catch (error) {
        // Ignore errors, use default
      }
    };
    fetchTimeFormat();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Validate times
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);

      if (endHours < startHours || (endHours === startHours && endMinutes <= startMinutes)) {
        setError("End time must be after start time");
        setIsSaving(false);
        return;
      }

      // Save working hours
      const hoursResponse = await fetch("/api/users/working-hours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workStartTime: startTime,
          workEndTime: endTime,
        }),
      });

      if (!hoursResponse.ok) {
        const errorData = await hoursResponse.json();
        throw new Error(errorData.error || "Failed to save working hours");
      }

      // Save time format preference
      const formatResponse = await fetch("/api/users/time-format", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time_format_preference: timeFormat,
        }),
      });

      if (!formatResponse.ok) {
        // Don't fail if time format save fails, just log it
        console.warn("Failed to save time format preference");
      }

      router.refresh();
      onNext();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save working hours"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const presets = [
    { 
      label: timeFormat === "12h" ? "9 AM - 5 PM" : "09:00 - 17:00", 
      start: "09:00", 
      end: "17:00" 
    },
    { 
      label: timeFormat === "12h" ? "10 AM - 6 PM" : "10:00 - 18:00", 
      start: "10:00", 
      end: "18:00" 
    },
    { 
      label: timeFormat === "12h" ? "8 AM - 8 PM" : "08:00 - 20:00", 
      start: "08:00", 
      end: "20:00" 
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900">
          When do you typically work?
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          We&apos;ll use this to calculate your daily action capacity. You can
          change this later in Settings.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setStartTime(preset.start);
                setEndTime(preset.end);
              }}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                startTime === preset.start && endTime === preset.end
                  ? "border-purple-600 bg-purple-50 text-purple-700"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Time Format Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <div>
            <p className="text-sm font-medium text-zinc-900">Time format</p>
            <p className="text-xs text-zinc-600">
              Choose how to display your working hours
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTimeFormat("12h")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                timeFormat === "12h"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              12h
            </button>
            <button
              type="button"
              onClick={() => setTimeFormat("24h")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                timeFormat === "24h"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              24h
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="start-time"
              className="block text-sm font-medium text-zinc-900"
            >
              Start Time
            </label>
            <input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              step="900"
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            {timeFormat === "12h" && (
              <p className="mt-1 text-xs text-zinc-500">
                {convert24To12(startTime)}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="end-time"
              className="block text-sm font-medium text-zinc-900"
            >
              End Time
            </label>
            <input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              step="900"
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            {timeFormat === "12h" && (
              <p className="mt-1 text-xs text-zinc-500">
                {convert24To12(endTime)}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSaving}
          className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={isSaving}
          className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}

