"use client";

import type { Lead } from "@/lib/leads/types";
import { LeadRow } from "./LeadRow";

interface LeadListProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onSnooze: (leadId: string) => void;
  onUnsnooze: (leadId: string) => void;
  onArchive: (leadId: string) => void;
  onRestore: (leadId: string) => void;
}

export function LeadList({
  leads,
  onEdit,
  onSnooze,
  onUnsnooze,
  onArchive,
  onRestore,
}: LeadListProps) {
  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
        <p className="text-sm text-zinc-600">
          No relationships yet. Add your first relationship to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="relationship-list">
      {leads.map((lead) => (
        <LeadRow
          key={lead.id}
          lead={lead}
          onEdit={onEdit}
          onSnooze={onSnooze}
          onUnsnooze={onUnsnooze}
          onArchive={onArchive}
          onRestore={onRestore}
        />
      ))}
    </div>
  );
}

