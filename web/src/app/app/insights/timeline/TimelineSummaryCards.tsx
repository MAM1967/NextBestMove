"use client";

interface TimelineSummary {
  total_days: number;
  avg_completion_rate: number;
  avg_reply_rate: number;
  total_actions_completed: number;
  total_replies_received: number;
}

interface TimelineSummaryCardsProps {
  summary: TimelineSummary;
}

export function TimelineSummaryCards({ summary }: TimelineSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* Total Days */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="text-sm font-medium text-zinc-600">Total Days</div>
        <div className="mt-1 text-2xl font-semibold text-zinc-900">
          {summary.total_days}
        </div>
      </div>

      {/* Average Completion Rate */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="text-sm font-medium text-zinc-600">Avg Completion Rate</div>
        <div className="mt-1 text-2xl font-semibold text-zinc-900">
          {Math.round(summary.avg_completion_rate * 100)}%
        </div>
      </div>

      {/* Average Reply Rate */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="text-sm font-medium text-zinc-600">Avg Reply Rate</div>
        <div className="mt-1 text-2xl font-semibold text-zinc-900">
          {Math.round(summary.avg_reply_rate * 100)}%
        </div>
      </div>

      {/* Total Actions Completed */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="text-sm font-medium text-zinc-600">Actions Completed</div>
        <div className="mt-1 text-2xl font-semibold text-zinc-900">
          {summary.total_actions_completed}
        </div>
      </div>

      {/* Total Replies Received */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="text-sm font-medium text-zinc-600">Replies Received</div>
        <div className="mt-1 text-2xl font-semibold text-zinc-900">
          {summary.total_replies_received}
        </div>
      </div>
    </div>
  );
}

