"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface BreakdownItem {
  reason: string;
  count: number;
  percentage: number;
}

interface FeedbackItem {
  id: string;
  user_id: string;
  subscription_id: string | null;
  cancellation_reason: string | null;
  additional_feedback: string | null;
  created_at: string;
  users: {
    email: string;
    name: string;
  };
}

export default function CancellationAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reasonFilter, setReasonFilter] = useState<string>("");

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate, reasonFilter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (reasonFilter) params.append("reason", reasonFilter);

      const response = await fetch(
        `/api/admin/cancellation-analytics?${params.toString()}`
      );

      if (response.status === 403) {
        setError("Access denied. Admin access required.");
        return;
      }

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to fetch analytics");
      }

      const data = (await response.json()) as {
        total: number;
        breakdown: BreakdownItem[];
        feedback: FeedbackItem[];
      };

      setTotal(data.total);
      setBreakdown(data.breakdown);
      setFeedback(data.feedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "User Email",
      "User Name",
      "Cancellation Reason",
      "Additional Feedback",
    ];
    const rows = feedback.map((item) => [
      new Date(item.created_at).toLocaleDateString(),
      item.users.email,
      item.users.name,
      item.cancellation_reason || "N/A",
      item.additional_feedback || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cancellation-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-zinc-600">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => router.push("/app")}
            className="mt-2 text-sm text-red-600 underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">
            Cancellation Feedback Analytics
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Analyze cancellation reasons and feedback to identify improvement
            opportunities.
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-4 md:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-zinc-700">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-700">
            Filter by Reason
          </label>
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">All Reasons</option>
            {breakdown.map((item) => (
              <option key={item.reason} value={item.reason}>
                {item.reason} ({item.count})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setReasonFilter("");
            }}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Summary</h2>
        <p className="mt-2 text-3xl font-bold text-zinc-900">{total}</p>
        <p className="text-sm text-zinc-600">Total cancellations</p>
      </div>

      {/* Breakdown Chart */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Breakdown by Reason
        </h2>
        <div className="space-y-3">
          {breakdown.length === 0 ? (
            <p className="text-sm text-zinc-600">No data available</p>
          ) : (
            breakdown.map((item) => (
              <div key={item.reason} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-900">
                    {item.reason || "Unknown"}
                  </span>
                  <span className="text-sm text-zinc-600">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Individual Feedback */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Individual Feedback ({feedback.length})
        </h2>
        <div className="space-y-4">
          {feedback.length === 0 ? (
            <p className="text-sm text-zinc-600">No feedback available</p>
          ) : (
            feedback.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-900">
                      {item.users.name} ({item.users.email})
                    </p>
                    <p className="text-xs text-zinc-600">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  {item.cancellation_reason && (
                    <span className="rounded-full border border-purple-300 bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                      {item.cancellation_reason}
                    </span>
                  )}
                </div>
                {item.additional_feedback && (
                  <p className="mt-2 text-sm text-zinc-700">
                    {item.additional_feedback}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

