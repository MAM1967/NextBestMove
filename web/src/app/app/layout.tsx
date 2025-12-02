import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./SignOutButton";
import { ensureUserProfile } from "@/lib/supabase/userProfile";
import { syncCalendarOnLogin } from "@/lib/calendar/sync-on-login";
import { DowngradeWarningChecker } from "./components/DowngradeWarningChecker";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ensure user profile exists (creates if missing)
  let userProfile = null;
  if (user) {
    await ensureUserProfile(user.id);

    // Get user profile including onboarding status
    const { data } = await supabase
      .from("users")
      .select("name, email, onboarding_completed")
      .eq("id", user.id)
      .single();
    userProfile = data;

    // Redirect to onboarding if not completed (unless already on onboarding page)
    // Note: This check is done in the page component, not here, to avoid layout issues
    // The onboarding page itself will handle the redirect check

    // Sync calendar on login (non-blocking, runs in background)
    // This ensures calendar data is fresh for capacity calculations
    syncCalendarOnLogin(user.id).catch((error) => {
      // Silently fail - don't block page rendering
      console.warn("Calendar sync on login failed:", error);
    });
  }

  return (
    <div className="flex min-h-screen bg-zinc-100 text-zinc-900">
      <aside className="flex w-64 flex-col border-r border-zinc-200 bg-white/80 px-4 py-6 backdrop-blur">
        <div className="mb-6">
          <Link
            href="/app"
            className="block text-sm font-semibold text-zinc-500"
          >
            NextBestMove
          </Link>
        </div>
        <nav className="space-y-1 text-sm">
          <Link
            href="/app"
            className="block rounded-md px-2 py-1.5 hover:bg-zinc-100"
          >
            Dashboard
          </Link>
          <Link
            href="/app/pins"
            className="block rounded-md px-2 py-1.5 hover:bg-zinc-100"
          >
            Pins
          </Link>
          <Link
            href="/app/plan"
            className="block rounded-md px-2 py-1.5 hover:bg-zinc-100"
          >
            Daily Plan
          </Link>
          <Link
            href="/app/actions"
            className="block rounded-md px-2 py-1.5 hover:bg-zinc-100"
          >
            Actions
          </Link>
          <Link
            href="/app/tasks"
            className="block rounded-md px-2 py-1.5 hover:bg-zinc-100"
          >
            Tasks
          </Link>
          <Link
            href="/app/weekly-summary"
            className="block rounded-md px-2 py-1.5 hover:bg-zinc-100"
          >
            Weekly Summary
          </Link>
          <Link
            href="/app/content-ideas"
            className="block rounded-md px-2 py-1.5 hover:bg-zinc-100"
          >
            Content Ideas
          </Link>
          <Link
            href="/app/insights"
            className="block rounded-md px-2 py-1.5 hover:bg-zinc-100"
          >
            Insights
          </Link>
          <Link
            href="/app/settings"
            className="block rounded-md px-2 py-1.5 hover:bg-zinc-100"
          >
            Settings
          </Link>
        </nav>
        <div className="mt-auto space-y-4 border-t border-zinc-200 pt-4">
          {user && (
            <div className="text-xs">
              <p className="font-medium text-zinc-900">
                {userProfile?.name || user.email?.split("@")[0]}
              </p>
              <p className="text-zinc-500">{user.email}</p>
            </div>
          )}
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 px-8 py-8">
        {children}
        <DowngradeWarningChecker />
      </main>
    </div>
  );
}
