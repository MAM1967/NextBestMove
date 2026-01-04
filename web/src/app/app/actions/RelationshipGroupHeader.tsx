import type { Lead, LeadBasic } from "@/lib/leads/types";

interface RelationshipGroupHeaderProps {
  relationship: LeadBasic | Lead;
  actionCount: number;
  onViewAll?: () => void;
}

export function RelationshipGroupHeader({ 
  relationship, 
  actionCount,
  onViewAll 
}: RelationshipGroupHeaderProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-200">
      <div className="flex items-center gap-3">
        <h4 className="text-base font-semibold text-zinc-900">{relationship.name}</h4>
        {'tier' in relationship && relationship.tier && (
          <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
            {relationship.tier}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-500">{actionCount} {actionCount === 1 ? 'action' : 'actions'}</span>
        {onViewAll && actionCount > 3 && (
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            View all
          </button>
        )}
      </div>
    </div>
  );
}

