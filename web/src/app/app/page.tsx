import { supabase } from "@/lib/supabaseClient";

export default async function AppDashboardPage() {
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, title, status")
    .limit(5);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Today&apos;s next best move
        </h1>
        <p className="text-sm text-zinc-600">
          This dashboard is wired to Supabase. Once your schema is in
          place, tasks from the database will appear below.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-900">
            Suggested focus
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            e.g. &quot;Deep work: Ship NextBestMove onboarding flow&quot;.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-900">
            Time until next event
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Calendar-aware availability will show up here.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-900">Energy check</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Quick self-check or inferred energy, to shape suggestions.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-medium text-zinc-900">
          Today&apos;s tasks (Supabase demo)
        </h2>
        {error && (
          <p className="mt-2 text-sm text-red-600">
            Error loading tasks from Supabase: {error.message}
          </p>
        )}
        {!error && (!tasks || tasks.length === 0) && (
          <p className="mt-2 text-sm text-zinc-600">
            No tasks found yet. Add some rows to the <code>tasks</code> table in
            Supabase to see them here.
          </p>
        )}
        {!error && tasks && tasks.length > 0 && (
          <ul className="mt-3 space-y-2 text-sm">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2"
              >
                <span>{task.title}</span>
                <span className="text-xs uppercase tracking-wide text-zinc-500">
                  {task.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}


