"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TimelineChart } from "./TimelineChart";
import { TimelineSummaryCards } from "./TimelineSummaryCards";
import { logError } from "@/lib/utils/logger";

interface TimelineDataPoint {
  date: string;
  metrics: {
    actions_completed: number;
    actions_created: number;
    replies_received: number;
    pins_created: number;
    pins_archived: number;
    streak_day: number;
    completion_rate: number;
    reply_rate: number;
  };
}

interface TimelineSummary {
  total_days: number;
  avg_completion_rate: number;
  avg_reply_rate: number;
  total_actions_completed: number;
  total_replies_received: number;
}

export default function PerformanceTimelinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TimelineDataPoint[]>([]);
  const [summary, setSummary] = useState<TimelineSummary | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);

  // Date range state
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");

  useEffect(() => {
    fetchTimelineData();
  }, [startDate, endDate, granularity]);

  const fetchTimelineData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate,
        endDate,
        granularity,
      });

      const response = await fetch(`/api/performance-timeline?${params.toString()}`);

      if (response.status === 402) {
        setRequiresUpgrade(true);
        setIsPremium(false);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch timeline data");
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data || []);
        setSummary(result.summary || null);
        setIsPremium(true);
        setRequiresUpgrade(false);
      } else {
        throw new Error(result.error || "Failed to fetch timeline data");
      }
    } catch (err) {
      logError("Failed to fetch performance timeline", err);
      setError(err instanceof Error ? err.message : "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const response = await fetch("/api/billing/customer-portal", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to open billing portal");
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error("No portal URL returned");
      }
      window.location.href = url;
    } catch (error) {
      console.error("Error opening billing portal:", error);
      alert("Unable to open billing portal. Please try again later.");
    }
  };

  // Quick date range presets
  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setEndDate(end.toISOString().split("T")[0]);
    setStartDate(start.toISOString().split("T")[0]);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-600">Loading timeline...</p>
      </div>
    );
  }

  if (requiresUpgrade) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Performance Timeline
          </h1>
          <p className="max-w-2xl text-sm text-zinc-600">
            Visualize your historical performance metrics and track progress over time.
          </p>
        </header>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-12 text-center">
          <div className="mx-auto max-w-md">
            <div className="mb-4 text-5xl">📊</div>
            <h2 className="text-xl font-semibold text-zinc-900">
              Performance Timeline is a Premium Feature
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Upgrade to Premium to see your historical performance metrics, track trends, and
              understand your progress over time.
            </p>
            <button
              onClick={handleUpgrade}
              className="mt-6 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Performance Timeline
          </h1>
        </header>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchTimelineData}
            className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Performance Timeline
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600">
          Track your performance metrics over time and identify trends.
        </p>
      </header>

      {/* Controls */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range Presets */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-700">Quick Range:</span>
            <button
              onClick={() => setDateRange(7)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              7 days
            </button>
            <button
              onClick={() => setDateRange(30)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              30 days
            </button>
            <button
              onClick={() => setDateRange(90)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              90 days
            </button>
            <button
              onClick={() => setDateRange(365)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              1 year
            </button>
          </div>

          {/* Custom Date Range */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-zinc-700">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700"
            />
            <label className="text-sm font-medium text-zinc-700">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700"
            />
          </div>

          {/* Granularity Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-zinc-700">View:</label>
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as "day" | "week" | "month")}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && <TimelineSummaryCards summary={summary} />}

      {/* Timeline Chart */}
      {data.length > 0 ? (
        <TimelineChart data={data} granularity={granularity} />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
          <p className="text-zinc-600">
            No timeline data available for the selected date range.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Timeline data is generated daily. Check back tomorrow for updated metrics.
          </p>
        </div>
      )}
    </div>
  );
}

