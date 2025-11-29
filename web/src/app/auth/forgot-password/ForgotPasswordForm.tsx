"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { forgotPasswordAction } from "./actions";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, null);

  useEffect(() => {
    if (state?.success) {
      // Show success message (handled by state.message)
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {state.message || "Password reset email sent! Check your inbox for instructions."}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-900"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={state?.success}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
          placeholder="you@example.com"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || state?.success}
        className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Sending..." : state?.success ? "Email sent!" : "Send reset link"}
      </button>

      <p className="text-center text-sm text-zinc-600">
        Remember your password?{" "}
        <Link
          href="/auth/sign-in"
          className="font-medium text-zinc-900 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

