import Link from "next/link";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-100 text-zinc-900">
      <aside className="flex w-64 flex-col border-r border-zinc-200 bg-white/80 px-4 py-6 backdrop-blur">
        <div className="mb-6">
          <Link href="/" className="block text-sm font-semibold text-zinc-500">
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
            href="/app/tasks"
            className="block rounded-md px-2 py-1.5 hover:bg-zinc-100"
          >
            Tasks
          </Link>
          <Link
            href="/app/calendar"
            className="block rounded-md px-2 py-1.5 hover:bg-zinc-100"
          >
            Calendar
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
        <div className="mt-auto pt-6 text-xs text-zinc-400">
          Prototype shell – auth and data wiring to come.
        </div>
      </aside>
      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}


