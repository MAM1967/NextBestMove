"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUpAction } from "./actions";

export function SignUpForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(signUpAction, null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (state?.success) {
      router.push("/app");
      router.refresh();
    }
  }, [state, router]);

  // Debug logging
  useEffect(() => {
    if (state) {
      console.log("Sign-up state:", state);
    }
  }, [state]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value.length > 0 && value.length < 6) {
      setPasswordError("Password must be at least 6 characters");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (password.length < 6) {
      e.preventDefault();
      setPasswordError("Password must be at least 6 characters");
      return;
    }
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-zinc-900"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
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
          Email
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
          htmlFor="password"
          className="block text-sm font-medium text-zinc-900"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={handlePasswordChange}
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
            passwordError
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500"
          }`}
          placeholder="••••••••"
        />
        {passwordError ? (
          <p className="mt-1 text-xs text-red-600">{passwordError}</p>
        ) : (
        <p className="mt-1 text-xs text-zinc-500">
          Must be at least 6 characters
        </p>
        )}
      </div>

      <div className="flex items-start gap-2">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-black focus:ring-2 focus:ring-zinc-500"
        />
        <label htmlFor="terms" className="text-sm text-zinc-600">
          I agree to the{" "}
          <Link
            href="/terms"
            className="font-medium text-zinc-900 hover:underline"
            target="_blank"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="font-medium text-zinc-900 hover:underline"
            target="_blank"
          >
            Privacy Policy
          </Link>
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending || password.length < 6 || !!passwordError}
        className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-sm text-zinc-600">
        Already have an account?{" "}
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

