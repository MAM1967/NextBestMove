import type { ActionSource } from "../actions/types";

interface SourceBadgeProps {
  source: ActionSource;
  className?: string;
}

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const sourceConfig = {
    email: { label: 'Email', color: 'bg-blue-100 text-blue-800' },
    linkedin: { label: 'LinkedIn', color: 'bg-indigo-100 text-indigo-800' },
    calendar: { label: 'Calendar', color: 'bg-purple-100 text-purple-800' },
    meeting_note: { label: 'Meeting Note', color: 'bg-green-100 text-green-800' },
    manual: { label: 'Manual', color: 'bg-gray-100 text-gray-800' },
    system: { label: 'System', color: 'bg-yellow-100 text-yellow-800' },
  };
  
  const config = sourceConfig[source] || sourceConfig.manual;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.color} ${className || ''}`}>
      {config.label}
    </span>
  );
}

