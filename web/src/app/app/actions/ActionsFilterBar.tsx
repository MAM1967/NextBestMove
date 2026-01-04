"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { ActionSource, ActionIntentType } from "./types";
import { mapStateToStatus, type ActionStatus } from "@/lib/actions/status-mapping";
import type { FilterState } from "./ActionsList";

interface ActionsFilterBarProps {
  onFilterChange: (filters: FilterState) => void;
}

export function ActionsFilterBar({ onFilterChange }: ActionsFilterBarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<'due' | 'relationships'>(
    (searchParams.get('view') as 'due' | 'relationships') || 'due'
  );
  const [relationshipId, setRelationshipId] = useState<string | null>(
    searchParams.get('relationship_id')
  );
  const [dueFilter, setDueFilter] = useState<'overdue' | 'today' | 'next_7_days' | 'this_month' | 'none' | 'all'>(
    (searchParams.get('due_filter') as any) || 'all'
  );
  const [status, setStatus] = useState<ActionStatus[]>(
    searchParams.get('status')?.split(',').filter(Boolean) as ActionStatus[] || ['pending', 'waiting']
  );
  const [source, setSource] = useState<ActionSource[]>(
    searchParams.get('source')?.split(',').filter(Boolean) as ActionSource[] || []
  );
  const [intentType, setIntentType] = useState<ActionIntentType[]>(
    searchParams.get('intent_type')?.split(',').filter(Boolean) as ActionIntentType[] || []
  );

  useEffect(() => {
    const filters: FilterState = {
      view,
      relationshipId,
      dueFilter,
      status,
      source,
      intentType,
    };
    onFilterChange(filters);
    
    // Update URL
    const params = new URLSearchParams();
    params.set('view', view);
    if (relationshipId) params.set('relationship_id', relationshipId);
    if (dueFilter !== 'all') params.set('due_filter', dueFilter);
    if (status.length > 0) params.set('status', status.join(','));
    if (source.length > 0) params.set('source', source.join(','));
    if (intentType.length > 0) params.set('intent_type', intentType.join(','));
    router.replace(`/app/actions?${params.toString()}`, { scroll: false });
  }, [view, relationshipId, dueFilter, status, source, intentType, onFilterChange, router]);

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-zinc-200 px-4 py-3">
      <div className="flex items-center gap-4 flex-wrap">
        {/* View Toggle */}
        <div className="flex rounded-lg border border-zinc-300 p-1">
          <button
            onClick={() => setView('due')}
            className={`px-3 py-1.5 text-sm font-medium rounded ${
              view === 'due'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            Due
          </button>
          <button
            onClick={() => setView('relationships')}
            className={`px-3 py-1.5 text-sm font-medium rounded ${
              view === 'relationships'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            Relationships
          </button>
        </div>

        {/* Due Filter (shown in Due view) */}
        {view === 'due' && (
          <select
            value={dueFilter}
            onChange={(e) => setDueFilter(e.target.value as any)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          >
            <option value="all">All</option>
            <option value="overdue">Overdue</option>
            <option value="today">Today</option>
            <option value="next_7_days">Next 7 days</option>
            <option value="this_month">This month</option>
            <option value="none">No due date</option>
          </select>
        )}

        {/* Status Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['pending', 'waiting', 'snoozed', 'done'] as ActionStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(prev => 
                  prev.includes(s) 
                    ? prev.filter(x => x !== s)
                    : [...prev, s]
                );
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                status.includes(s)
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

