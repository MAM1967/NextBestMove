"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AccountDeletionSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/users/delete-account", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.error || "Failed to delete account";
        console.error("Delete account error:", data);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Delete account success:", result);

      // Sign out using Supabase client
      const supabase = createClient();
      await supabase.auth.signOut();

      // Small delay to ensure sign out completes
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Redirect to sign in page with deleted parameter
      window.location.href = "/auth/sign-in?deleted=true";
    } catch (err) {
      console.error("Error deleting account:", err);
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <h3 className="text-sm font-semibold text-red-900">
          Delete my account
        </h3>
        <p className="mt-1 text-xs text-red-700">
          This action cannot be undone. All your data will be permanently
          deleted, including pins, actions, plans, and summaries.
        </p>
        {!isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="mt-3 text-xs font-medium text-red-700 hover:text-red-800 underline"
          >
            I want to delete my account
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <label
                htmlFor="confirm-delete"
                className="block text-xs font-medium text-red-900 mb-1"
              >
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                id="confirm-delete"
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-red-900 placeholder-red-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="DELETE"
                disabled={isDeleting}
              />
            </div>
            {error && (
              <p className="text-xs text-red-700">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || confirmText !== "DELETE"}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete my account"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setConfirmText("");
                  setError(null);
                }}
                disabled={isDeleting}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

