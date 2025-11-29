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
      
      // Check if there are hash fragments in the URL (Supabase reset link format)
      // Also check query params in case the link format is different
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get("access_token") || searchParams.get("access_token");
      const type = hashParams.get("type") || searchParams.get("type");
      
      console.log("🔍 Checking reset link:", {
        hasHash: !!hash,
        hashLength: hash.length,
        hasSearchParams: searchParams.toString().length > 0,
        accessToken: !!accessToken,
        type,
        hash: hash.substring(0, 100),
        search: window.location.search.substring(0, 100),
        fullUrl: window.location.href.substring(0, 150),
      });
      
      if (accessToken && type === "recovery") {
        // Supabase client should automatically process hash fragments
        // But we need to wait for it to establish the session
        // Use onAuthStateChange to detect when session is established
        let resolved = false;
        let subscription: { unsubscribe: () => void } | null = null;
        
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("🔔 Auth state change:", { event, hasSession: !!session });
          if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
            if (!resolved) {
              resolved = true;
              setHasValidSession(true);
              setIsValidating(false);
              if (subscription) subscription.unsubscribe();
            }
          }
        });
        subscription = authSubscription;
        
        // Try to set session explicitly from hash fragments if needed
        // The createBrowserClient should handle this automatically, but let's be explicit
        try {
          // Get refresh token from hash if available
          const refreshToken = hashParams.get("refresh_token");
          if (accessToken && refreshToken) {
            const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            console.log("🔐 Set session from tokens:", { hasSession: !!sessionData.session, error: setSessionError?.message });
            if (sessionData.session) {
              if (!resolved) {
                resolved = true;
                setHasValidSession(true);
                setIsValidating(false);
                if (subscription) subscription.unsubscribe();
                return;
              }
            }
          }
        } catch (setSessionError) {
          console.error("❌ Error setting session:", setSessionError);
        }
        
        // Also check immediately in case session is already established
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log("📋 Initial session check:", { hasSession: !!session, error: sessionError?.message });
        
        if (session) {
          if (!resolved) {
            resolved = true;
            setHasValidSession(true);
            setIsValidating(false);
            if (subscription) subscription.unsubscribe();
            return;
          }
        }
        
        // Wait up to 5 seconds for session to be established
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            supabase.auth.getSession().then(({ data: { session: finalSession }, error: finalError }) => {
              console.log("⏱️ Final session check:", { hasSession: !!finalSession, error: finalError?.message });
              if (finalSession) {
                setHasValidSession(true);
              }
              setIsValidating(false);
              if (subscription) subscription.unsubscribe();
            });
          }
        }, 5000);
        
        // Cleanup timeout if component unmounts
        return () => {
          clearTimeout(timeoutId);
          if (subscription) subscription.unsubscribe();
        };
      } else {
        // No hash fragments - check if we already have a session
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log("📋 No hash fragments, checking session:", { hasSession: !!session, error: error?.message });
        if (session) {
          setHasValidSession(true);
        }
        setIsValidating(false);
      }
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

