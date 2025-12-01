"use client";

interface ViewPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionDescription?: string | null;
}

export function ViewPromptModal({
  isOpen,
  onClose,
  actionDescription,
}: ViewPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Content Prompt</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600"
            aria-label="Close"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-zinc-600">
              {actionDescription || "Content prompt will be displayed here."}
            </p>
            <p className="mt-4 text-xs text-zinc-500">
              Note: Full content prompt functionality will be available when the
              content generation feature is implemented.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




