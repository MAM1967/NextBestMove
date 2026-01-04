"use client";

import type { Action } from "./types";
import { UnifiedActionCard } from "../components/UnifiedActionCard";
import { SectionHeader } from "./SectionHeader";
import { RelationshipGroupHeader } from "./RelationshipGroupHeader";
import { ActionsEmptyState } from "./ActionsEmptyState";
import { getDaysDifference } from "@/lib/utils/dateUtils";
import type { ActionStatus } from "@/lib/actions/status-mapping";
import { mapStateToStatus } from "@/lib/actions/status-mapping";
import type { ActionSource, ActionIntentType } from "./types";

export interface FilterState {
  view: 'due' | 'relationships';
  relationshipId: string | null;
  dueFilter: 'overdue' | 'today' | 'next_7_days' | 'this_month' | 'none' | 'all';
  status: ActionStatus[];
  source: ActionSource[];
  intentType: ActionIntentType[];
}

interface ActionsListProps {
  view: 'due' | 'relationships';
  actions: Action[];
  filters: FilterState;
  onComplete: (actionId: string, completionType?: string) => void;
  onSnooze: (actionId: string) => void;
  onAddNote: (actionId: string) => void;
  onGotReply?: (actionId: string) => void;
  onViewPrompt?: (action: Action) => void;
  onClick?: (action: Action) => void;
  onSetPromise?: (actionId: string, promisedDueAt: string | null) => Promise<void>;
  onSetEstimatedMinutes?: (actionId: string) => void;
}

export function ActionsList({
  view,
  actions,
  filters,
  onComplete,
  onSnooze,
  onAddNote,
  onGotReply,
  onViewPrompt,
  onClick,
  onSetPromise,
  onSetEstimatedMinutes,
}: ActionsListProps) {
  // Apply filters
  let filteredActions = actions.filter(action => {
    // Status filter
    const actionStatus = mapStateToStatus(action.state);
    if (!filters.status.includes(actionStatus)) return false;

    // Source filter
    if (filters.source.length > 0 && (!action.source || !filters.source.includes(action.source))) {
      return false;
    }

    // Intent type filter
    if (filters.intentType.length > 0 && (!action.intent_type || !filters.intentType.includes(action.intent_type))) {
      return false;
    }

    // Relationship filter
    if (filters.relationshipId && action.person_id !== filters.relationshipId) {
      return false;
    }

    // Due filter (for Due view)
    if (view === 'due' && filters.dueFilter !== 'all') {
      const daysDiff = getDaysDifference(action.due_date);
      switch (filters.dueFilter) {
        case 'overdue':
          if (daysDiff <= 0) return false;
          break;
        case 'today':
          if (daysDiff !== 0) return false;
          break;
        case 'next_7_days':
          if (daysDiff < 0 || daysDiff > 7) return false;
          break;
        case 'this_month':
          const today = new Date();
          const actionDate = new Date(action.due_date);
          if (actionDate.getMonth() !== today.getMonth() || actionDate.getFullYear() !== today.getFullYear()) {
            return false;
          }
          break;
        case 'none':
          // This would require checking if due_date is null, but our schema requires it
          return false;
      }
    }

    return true;
  });

  if (filteredActions.length === 0) {
    return (
      <ActionsEmptyState
        variant={filters.status.length > 0 || filters.source.length > 0 || filters.intentType.length > 0 ? 'filtered' : view === 'due' ? 'due' : 'relationships'}
        onClearFilters={() => {
          // Clear filters logic would go here
        }}
      />
    );
  }

  if (view === 'due') {
    // Group by due date bucket
    const overdue: Action[] = [];
    const today: Action[] = [];
    const upcoming: Action[] = [];
    const later: Action[] = [];

    filteredActions.forEach(action => {
      const daysDiff = getDaysDifference(action.due_date);
      if (daysDiff > 0) {
        overdue.push(action);
      } else if (daysDiff === 0) {
        today.push(action);
      } else if (daysDiff >= -7) {
        upcoming.push(action);
      } else {
        later.push(action);
      }
    });

    // Sort each group
    const sortActions = (a: Action[]) => {
      return a.sort((x, y) => {
        // Relationship-linked first
        if (x.person_id && !y.person_id) return -1;
        if (!x.person_id && y.person_id) return 1;
        // Then by due date
        return new Date(x.due_date).getTime() - new Date(y.due_date).getTime();
      });
    };

    return (
      <div className="space-y-6">
        {overdue.length > 0 && (
          <div>
            <SectionHeader title="Overdue" count={overdue.length} />
            <div className="mt-3 space-y-3">
              {sortActions(overdue).map(action => (
                <UnifiedActionCard
                  key={action.id}
                  action={action}
                  onComplete={onComplete}
                  onSnooze={onSnooze}
                  onAddNote={onAddNote}
                  onGotReply={onGotReply}
                  onViewPrompt={onViewPrompt}
                  onClick={onClick}
                  onSetPromise={onSetPromise}
                  onSetEstimatedMinutes={onSetEstimatedMinutes}
                />
              ))}
            </div>
          </div>
        )}
        {today.length > 0 && (
          <div>
            <SectionHeader title="Today" count={today.length} />
            <div className="mt-3 space-y-3">
              {sortActions(today).map(action => (
                <UnifiedActionCard
                  key={action.id}
                  action={action}
                  onComplete={onComplete}
                  onSnooze={onSnooze}
                  onAddNote={onAddNote}
                  onGotReply={onGotReply}
                  onViewPrompt={onViewPrompt}
                  onClick={onClick}
                  onSetPromise={onSetPromise}
                  onSetEstimatedMinutes={onSetEstimatedMinutes}
                />
              ))}
            </div>
          </div>
        )}
        {upcoming.length > 0 && (
          <div>
            <SectionHeader title="Next 7 days" count={upcoming.length} />
            <div className="mt-3 space-y-3">
              {sortActions(upcoming).map(action => (
                <UnifiedActionCard
                  key={action.id}
                  action={action}
                  onComplete={onComplete}
                  onSnooze={onSnooze}
                  onAddNote={onAddNote}
                  onGotReply={onGotReply}
                  onViewPrompt={onViewPrompt}
                  onClick={onClick}
                  onSetPromise={onSetPromise}
                  onSetEstimatedMinutes={onSetEstimatedMinutes}
                />
              ))}
            </div>
          </div>
        )}
        {later.length > 0 && (
          <div>
            <SectionHeader title="Later" count={later.length} />
            <div className="mt-3 space-y-3">
              {sortActions(later).map(action => (
                <UnifiedActionCard
                  key={action.id}
                  action={action}
                  onComplete={onComplete}
                  onSnooze={onSnooze}
                  onAddNote={onAddNote}
                  onGotReply={onGotReply}
                  onViewPrompt={onViewPrompt}
                  onClick={onClick}
                  onSetPromise={onSetPromise}
                  onSetEstimatedMinutes={onSetEstimatedMinutes}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } else {
    // Relationships view: group by relationship
    const byRelationship = new Map<string, { relationship: any; actions: Action[] }>();
    const generalBusiness: Action[] = [];

    filteredActions.forEach(action => {
      if (action.person_id && action.leads) {
        const key = action.person_id;
        if (!byRelationship.has(key)) {
          byRelationship.set(key, { relationship: action.leads, actions: [] });
        }
        byRelationship.get(key)!.actions.push(action);
      } else {
        generalBusiness.push(action);
      }
    });

    return (
      <div className="space-y-6">
        {Array.from(byRelationship.values()).map(({ relationship, actions: relActions }) => (
          <div key={relationship.id}>
            <RelationshipGroupHeader
              relationship={relationship}
              actionCount={relActions.length}
            />
            <div className="mt-3 space-y-3">
              {relActions.slice(0, 3).map(action => (
                <UnifiedActionCard
                  key={action.id}
                  action={action}
                  onComplete={onComplete}
                  onSnooze={onSnooze}
                  onAddNote={onAddNote}
                  onGotReply={onGotReply}
                  onViewPrompt={onViewPrompt}
                  onClick={onClick}
                  onSetPromise={onSetPromise}
                  onSetEstimatedMinutes={onSetEstimatedMinutes}
                />
              ))}
            </div>
          </div>
        ))}
        {generalBusiness.length > 0 && (
          <div>
            <SectionHeader title="General Business" count={generalBusiness.length} />
            <div className="mt-3 space-y-3">
              {generalBusiness.map(action => (
                <UnifiedActionCard
                  key={action.id}
                  action={action}
                  onComplete={onComplete}
                  onSnooze={onSnooze}
                  onAddNote={onAddNote}
                  onGotReply={onGotReply}
                  onViewPrompt={onViewPrompt}
                  onClick={onClick}
                  onSetPromise={onSetPromise}
                  onSetEstimatedMinutes={onSetEstimatedMinutes}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
}

