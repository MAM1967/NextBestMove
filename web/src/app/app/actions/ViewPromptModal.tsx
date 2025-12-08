"use client";

import Link from "next/link";

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
            <p className="text-sm text-zinc-600 mb-4">
              {actionDescription || "Content action: Draft social media post or content."}
            </p>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs text-zinc-600 mb-2">
                <strong>Content Prompts:</strong> Generated content prompts are available in your Weekly Summary and saved to the Content Ideas page.
              </p>
              <p className="text-xs text-zinc-500">
                Content prompts are generated weekly based on your activity. To view saved prompts, go to the <strong>Content Ideas</strong> page.
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Link
              href="/app/content-ideas"
              onClick={onClose}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              View Content Ideas
            </Link>
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







