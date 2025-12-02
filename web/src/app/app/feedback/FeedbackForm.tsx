"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitFeedback } from "./actions";

const CANCELLATION_REASONS = [
  { value: "too_expensive", label: "Too expensive" },
  { value: "not_useful", label: "Not useful for my workflow" },
  { value: "too_complex", label: "Too complex / hard to use" },
  { value: "missing_features", label: "Missing features I need" },
  { value: "found_alternative", label: "Found a better alternative" },
  { value: "not_using_enough", label: "Not using it enough to justify cost" },
  { value: "temporary_break", label: "Taking a temporary break" },
  { value: "other", label: "Other reason" },
] as const;

export function FeedbackForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(submitFeedback, null);

  useEffect(() => {
    if (state?.success) {
      // Show success message briefly, then redirect
      setTimeout(() => {
        router.push("/app/settings");
      }, 2000);
    }
  }, [state, router]);

  if (state?.success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-green-900">
          Thank you for your feedback!
        </h2>
        <p className="text-sm text-green-700">
          We appreciate you taking the time to share your thoughts. Redirecting you to settings...
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <div>
        <label className="mb-3 block text-sm font-medium text-zinc-900">
          What was the main reason you canceled? <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {CANCELLATION_REASONS.map((reason) => (
            <label
              key={reason.value}
              className="flex items-center space-x-2 rounded-md border border-zinc-200 p-3 hover:bg-zinc-50 cursor-pointer"
            >
              <input
                type="radio"
                name="reason"
                value={reason.value}
                required
                className="h-4 w-4 text-zinc-600 focus:ring-zinc-500"
              />
              <span className="text-sm text-zinc-700">{reason.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="additional_feedback"
          className="mb-2 block text-sm font-medium text-zinc-900"
        >
          Additional feedback (optional)
        </label>
        <textarea
          id="additional_feedback"
          name="additional_feedback"
          rows={4}
          className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="Tell us more about your experience..."
        />
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Submitting..." : "Submit Feedback"}
        </button>
        <a
          href="/app/settings"
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          Skip
        </a>
      </div>

      <p className="text-xs text-zinc-500">
        We read every message. Your feedback helps us improve NextBestMove for everyone.
      </p>
    </form>
  );
}

