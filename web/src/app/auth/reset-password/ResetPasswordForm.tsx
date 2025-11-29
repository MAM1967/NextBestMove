"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordAction } from "./actions";

export function ResetPasswordForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(resetPasswordAction, null);
  const [isValidating, setIsValidating] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  // Check if we have a valid session from the reset link
  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      
      // Supabase automatically handles the hash fragments from the reset link
      // and establishes a session. We just need to check if we have a session.
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setHasValidSession(true);
      } else {
        // Check if there are hash fragments in the URL (Supabase reset link format)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const type = hashParams.get("type");
        
        if (accessToken && type === "recovery") {
          // Supabase is processing the token, wait a moment and check again
          setTimeout(async () => {
            const { data: { session: newSession } } = await supabase.auth.getSession();
            if (newSession) {
              setHasValidSession(true);
            } else {
              setIsValidating(false);
            }
          }, 1000);
        } else {
          setIsValidating(false);
        }
      }
      setIsValidating(false);
    }

    checkSession();
  }, []);

  useEffect(() => {
    if (state?.success) {
      // Redirect to sign-in page after successful password reset
      setTimeout(() => {
        router.push("/auth/sign-in?message=Password reset successfully. Please sign in with your new password.");
      }, 2000);
    }
  }, [state, router]);

  if (isValidating) {
    return (
      <div className="text-center text-sm text-zinc-600">
        Validating reset link...
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Invalid or expired reset link. Please request a new password reset.
        </div>
        <Link
          href="/auth/forgot-password"
          className="block w-full rounded-md bg-black px-4 py-2 text-center text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">

      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Password reset successfully! Redirecting to sign in...
        </div>
      )}

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-zinc-900"
        >
          New Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          disabled={state?.success}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
          placeholder="••••••••"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Must be at least 6 characters
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-zinc-900"
        >
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          disabled={state?.success}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:cursor-not-allowed"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || state?.success}
        className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Resetting..." : state?.success ? "Password reset!" : "Reset password"}
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

