interface ActionsEmptyStateProps {
  variant: 'global' | 'filtered' | 'due' | 'relationships';
  onClearFilters?: () => void;
}

export function ActionsEmptyState({ variant, onClearFilters }: ActionsEmptyStateProps) {
  const getContent = () => {
    switch (variant) {
      case 'global':
        return {
          title: 'No actions yet',
          message: 'Actions appear when you capture a follow-up or a signal creates one.',
          cta: 'Create action',
        };
      case 'filtered':
        return {
          title: 'No matching actions',
          message: 'Try adjusting your filters to see more actions.',
          cta: 'Clear filters',
        };
      case 'due':
        return {
          title: 'No actions due',
          message: 'You\'re all caught up! Actions will appear here when they\'re due.',
          cta: null,
        };
      case 'relationships':
        return {
          title: 'No open actions for relationships',
          message: 'Actions linked to relationships will appear here.',
          cta: null,
        };
      default:
        return {
          title: 'No actions',
          message: '',
          cta: null,
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <h3 className="text-lg font-semibold text-zinc-900 mb-2">{content.title}</h3>
      {content.message && (
        <p className="text-sm text-zinc-600 mb-4 max-w-md">{content.message}</p>
      )}
      {content.cta && (
        <button
          onClick={onClearFilters}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {content.cta}
        </button>
      )}
    </div>
  );
}

