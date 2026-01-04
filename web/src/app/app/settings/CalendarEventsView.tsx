"use client";

import { useState, useEffect } from "react";
import { getCapacityLabel } from "@/lib/plan/capacity-labels";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  duration: number;
};

type DayAvailability = {
  date: string;
  events: CalendarEvent[];
  totalBusyMinutes: number;
  availableMinutes: number;
  capacity: "micro" | "light" | "standard" | "heavy" | "default";
  suggestedActionCount: number;
};

type CalendarEventsData = {
  connected: boolean;
  provider?: string;
  timezone?: string;
  days?: DayAvailability[];
  message?: string;
  error?: string;
};

export function CalendarEventsView() {
  const [data, setData] = useState<CalendarEventsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        // Add cache-busting timestamp to prevent stale data
        const response = await fetch(`/api/calendar/events?days=7&_t=${Date.now()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch calendar events");
        }
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || "Failed to load calendar events");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 text-center">
        <p className="text-sm text-zinc-600">Loading calendar events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-900">Error</p>
        <p className="mt-1 text-xs text-red-700">{error}</p>
      </div>
    );
  }

  if (!data || !data.connected) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center">
        <p className="text-sm text-zinc-600">
          {data?.message || "Calendar not connected"}
        </p>
      </div>
    );
  }

  if (!data.days || data.days.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 text-center">
        <p className="text-sm text-zinc-600">No events found in the next 7 days</p>
      </div>
    );
  }

  // Get capacity label based on capacity level and actual suggested action count
  const getCapacityLabelForDay = (capacity: string, actionCount: number): string => {
    const name = getCapacityLabel(capacity);
    if (actionCount === 0) {
      return `${name} (0 actions)`;
    } else if (actionCount === 1) {
      return `${name} (1 action)`;
    } else {
      return `${name} (${actionCount} actions)`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">
            Calendar Events & Availability (Next 7 Days)
          </h3>
          <span className="text-xs text-zinc-500 capitalize">
            {data.provider} • {data.timezone}
          </span>
        </div>

        <div className="space-y-4">
          {data.days.map((day) => {
            // Parse date string (YYYY-MM-DD) - create date at noon UTC to avoid timezone issues
            const date = new Date(day.date + "T12:00:00Z");
            // Check if this is today - compare date strings directly
            // Get today's date string in the same format (YYYY-MM-DD)
            const today = new Date();
            const todayStr = today.toISOString().split("T")[0];
            const isToday = day.date === todayStr;
            
            // Format date label using the date string directly to avoid timezone conversion
            // Parse YYYY-MM-DD and format it
            const [year, month, dayNum] = day.date.split("-").map(Number);
            const dateObj = new Date(Date.UTC(year, month - 1, dayNum, 12, 0, 0));
            const dateLabel = isToday
              ? "Today"
              : dateObj.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  timeZone: data.timezone || "UTC",
                });

            const busyHours = (day.totalBusyMinutes / 60).toFixed(1);
            const availableHours = (day.availableMinutes / 60).toFixed(1);

            return (
              <div
                key={day.date}
                className="rounded-lg border border-zinc-100 bg-zinc-50 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        isToday ? "text-purple-700" : "text-zinc-900"
                      }`}
                    >
                      {dateLabel}
                    </span>
                    {isToday && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-zinc-600">
                    {getCapacityLabelForDay(day.capacity, day.suggestedActionCount)}
                  </span>
                </div>

                {/* Availability Summary */}
                <div className="mb-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-500">Busy:</span>{" "}
                    <span className="font-medium text-zinc-900">
                      {busyHours}h
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Available:</span>{" "}
                    <span className="font-medium text-green-700">
                      {availableHours}h
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Capacity:</span>{" "}
                    <span className="font-medium text-purple-700">
                      {day.suggestedActionCount} actions
                    </span>
                  </div>
                </div>

                {/* Events List */}
                {day.events.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {day.events.map((event) => {
                      const start = new Date(event.start);
                      const end = new Date(event.end);
                      const timeStr = `${start.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })} - ${end.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}`;

                      return (
                        <div
                          key={event.id}
                          className="flex items-start gap-2 rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs"
                        >
                          <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-purple-500" />
                          <div className="flex-1">
                            <div className="font-medium text-zinc-900">
                              {event.title}
                            </div>
                            <div className="text-zinc-500">{timeStr}</div>
                          </div>
                          <div className="text-zinc-400">
                            {Math.round(event.duration)}m
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-zinc-500">
                    No events scheduled
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

