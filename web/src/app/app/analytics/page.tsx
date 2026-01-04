"use client";

import { useState, useEffect } from "react";
import type { DealProgressionMetrics } from "@/lib/analytics/deal-progression";
import type { DealStage } from "@/lib/analytics/deal-progression";

export default function AnalyticsPage() {
  const [dealMetrics, setDealMetrics] = useState<DealProgressionMetrics | null>(
    null
  );
  const [insights, setInsights] = useState<
    Array<{
      id: string;
      type: string;
      data: Record<string, unknown>;
      calculatedAt: string;
      periodStart: string;
      periodEnd: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const [dealResponse, insightsResponse] = await Promise.all([
        fetch(`/api/analytics/deal-progression?${params.toString()}`),
        fetch(`/api/analytics/insights?${params.toString()}`),
      ]);

      if (!dealResponse.ok) {
        throw new Error("Failed to fetch deal progression");
      }
      if (!insightsResponse.ok) {
        throw new Error("Failed to fetch insights");
      }

      const dealData = (await dealResponse.json()) as DealProgressionMetrics;
      const insightsData = (await insightsResponse.json()) as {
        insights: Array<{
          id: string;
          type: string;
          data: Record<string, unknown>;
          calculatedAt: string;
          periodStart: string;
          periodEnd: string;
        }>;
      };

      setDealMetrics(dealData);
      setInsights(insightsData.insights);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
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
        </div>
      </div>
    );
  }

  const stageOrder: DealStage[] = [
    "prospecting",
    "qualifying",
    "proposal",
    "negotiation",
    "closed_won",
    "closed_lost",
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Analytics</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Deeper insights into your deal progression and performance.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-4 md:grid-cols-3">
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
        <div className="flex items-end">
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Deal Progression Metrics */}
      {dealMetrics && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Deal Progression
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-zinc-600">Total Deals</p>
                <p className="text-2xl font-bold text-zinc-900">
                  {dealMetrics.totalDeals}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-600">Total Value</p>
                <p className="text-2xl font-bold text-zinc-900">
                  ${dealMetrics.totalValue.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-600">Win Rate</p>
                <p className="text-2xl font-bold text-zinc-900">
                  {(dealMetrics.winRate * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Deal Funnel */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Deal Funnel
            </h2>
            <div className="space-y-3">
              {stageOrder.map((stage, index) => {
                const count = dealMetrics.byStage[stage];
                const maxCount = Math.max(
                  ...Object.values(dealMetrics.byStage)
                );
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                return (
                  <div key={stage} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize text-zinc-900">
                        {stage.replace("_", " ")}
                      </span>
                      <span className="text-sm text-zinc-600">
                        {count} deals
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                      <div
                        className="h-full bg-purple-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conversion Rates */}
          {Object.keys(dealMetrics.conversionRates).length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900">
                Conversion Rates
              </h2>
              <div className="space-y-2">
                {Object.entries(dealMetrics.conversionRates).map(
                  ([transition, rate]) => (
                    <div
                      key={transition}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-zinc-700">
                        {transition.replace("->", " → ")}
                      </span>
                      <span className="text-sm font-medium text-zinc-900">
                        {(rate * 100).toFixed(1)}%
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Additional Insights */}
      {insights.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Additional Insights
          </h2>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
              >
                <h3 className="font-medium text-zinc-900 capitalize">
                  {insight.type.replace("_", " ")}
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Period: {new Date(insight.periodStart).toLocaleDateString()} -{" "}
                  {new Date(insight.periodEnd).toLocaleDateString()}
                </p>
                <div className="mt-2 text-sm text-zinc-700">
                  <pre className="whitespace-pre-wrap font-sans">
                    {JSON.stringify(insight.data, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!dealMetrics || dealMetrics.totalDeals === 0) &&
        insights.length === 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center">
            <p className="text-zinc-600">
              No analytics data available. Start tracking deal progression on
              your actions to see insights here.
            </p>
          </div>
        )}
    </div>
  );
}

