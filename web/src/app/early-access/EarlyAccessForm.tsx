"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitEarlyAccessForm } from "./actions";

export function EarlyAccessForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(submitEarlyAccessForm, null);

  // Redirect to homepage after successful submission (2-3 second delay)
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 2500); // 2.5 second delay
      return () => clearTimeout(timer);
    }
  }, [state?.success, router]);

  return (
    <form action={formAction} className="space-y-6">
      {state?.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">Thanks for signing up!</p>
          <p className="mt-1">
            We'll reach out personally with access details and a short onboarding.
          </p>
        </div>
      )}

      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-zinc-900"
        >
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="Your name"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-900"
        >
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="linkedin_url"
          className="block text-sm font-medium text-zinc-900"
        >
          LinkedIn URL
        </label>
        <input
          id="linkedin_url"
          name="linkedin_url"
          type="url"
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="https://linkedin.com/in/yourprofile"
        />
        <p className="mt-1 text-xs text-zinc-500">Optional</p>
      </div>

      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-zinc-900"
        >
          Role <span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          name="role"
          required
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          <option value="">Select your role</option>
          <option value="fractional_executive">Fractional Executive</option>
          <option value="solopreneur">Solopreneur</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="active_clients_count"
          className="block text-sm font-medium text-zinc-900"
        >
          How many active clients are you managing? <span className="text-red-500">*</span>
        </label>
        <input
          id="active_clients_count"
          name="active_clients_count"
          type="number"
          min="1"
          required
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="e.g., 3"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || state?.success}
        className="w-full rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Submitting..." : state?.success ? "Submitted!" : "Submit"}
      </button>
    </form>
  );
}

