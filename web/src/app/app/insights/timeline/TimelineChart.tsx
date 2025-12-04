"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

interface TimelineChartProps {
  data: TimelineDataPoint[];
  granularity: "day" | "week" | "month";
}

export function TimelineChart({ data, granularity }: TimelineChartProps) {
  // Format date for display based on granularity
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (granularity === "month") {
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } else if (granularity === "week") {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  // Prepare chart data
  const chartData = data.map((point) => ({
    date: formatDate(point.date),
    fullDate: point.date,
    "Actions Completed": point.metrics.actions_completed,
    "Actions Created": point.metrics.actions_created,
    "Replies Received": point.metrics.replies_received,
    "Completion Rate": Math.round(point.metrics.completion_rate * 100),
    "Reply Rate": Math.round(point.metrics.reply_rate * 100),
  }));

  return (
    <div className="space-y-6">
      {/* Actions Chart */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900">Actions Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorActionsCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorActionsCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#6b7280" }}
            />
            <YAxis stroke="#6b7280" fontSize={12} tick={{ fill: "#6b7280" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="Actions Completed"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorActionsCompleted)"
            />
            <Area
              type="monotone"
              dataKey="Actions Created"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorActionsCreated)"
            />
            <Area
              type="monotone"
              dataKey="Replies Received"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#colorReplies)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Rates Chart */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900">Performance Rates</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#6b7280" }}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#6b7280" }}
              domain={[0, 100]}
              label={{ value: "%", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              formatter={(value: number) => `${value}%`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Completion Rate"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: "#8b5cf6", r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Reply Rate"
              stroke="#ec4899"
              strokeWidth={2}
              dot={{ fill: "#ec4899", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

