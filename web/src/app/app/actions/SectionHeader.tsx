interface SectionHeaderProps {
  title: string;
  count?: number;
  className?: string;
}

export function SectionHeader({ title, count, className }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className || ''}`}>
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      {count !== undefined && (
        <span className="text-sm text-zinc-500">{count} {count === 1 ? 'action' : 'actions'}</span>
      )}
    </div>
  );
}

