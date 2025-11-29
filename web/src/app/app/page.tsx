import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function getErrorMessage(error: any): { title: string; message: string } {
  const errorMessage = error?.message || "Unknown error";
  const errorCode = error?.code || "";

  // Network/connection errors
  if (
    errorMessage.includes("fetch failed") ||
    errorMessage.includes("NetworkError") ||
    errorMessage.includes("Failed to fetch")
  ) {
    return {
      title: "Connection Error",
      message:
        "Unable to connect to Supabase. Please check your internet connection and ensure your Supabase project is running.",
    };
  }

  // Table doesn't exist
  if (
    errorCode === "PGRST116" ||
    errorMessage.includes("relation") ||
    errorMessage.includes("does not exist")
  ) {
    return {
      title: "Table Not Found",
      message:
        "The 'tasks' table doesn't exist yet. Please run the migration file: supabase/migrations/202501270001_create_tasks_table.sql",
    };
  }

  // Permission/RLS errors
  if (
    errorCode === "PGRST301" ||
    errorMessage.includes("permission") ||
    errorMessage.includes("row-level security")
  ) {
    return {
      title: "Permission Error",
      message:
        "You don't have permission to access this data. Check your Supabase RLS policies.",
    };
  }

  // Generic error
  return {
    title: "Error Loading Tasks",
    message: `Unable to load tasks: ${errorMessage}`,
  };
}

export default async function AppDashboardPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  // Check if user has completed onboarding
  const { data: userProfile } = await supabase
    .from("users")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!userProfile?.onboarding_completed) {
    redirect("/onboarding");
  }

  let tasks = null;
  let error = null;
  let errorInfo = null;

  try {
    const result = await supabase
      .from("tasks")
      .select("id, title, status")
      .limit(5);

    tasks = result.data;
    error = result.error;

    // Log the actual error for debugging
    if (error) {
      console.error("Supabase error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error,
      });
    }
  } catch (err: any) {
    // Catch any unexpected errors (like network failures)
    console.error("Unexpected error fetching tasks:", err);
    error = {
      message: err?.message || "Unknown error",
      code: err?.code || "",
    };
  }

  errorInfo = error ? getErrorMessage(error) : null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Today&apos;s next best move
        </h1>
        <p className="text-sm text-zinc-600">
          This dashboard is wired to Supabase. Once your schema is in place,
          tasks from the database will appear below.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium text-zinc-900">Suggested focus</h2>
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
        {errorInfo && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="text-sm font-semibold text-red-900">
              {errorInfo.title}
            </h3>
            <p className="mt-1 text-sm text-red-700">{errorInfo.message}</p>
            {errorInfo.title === "Table Not Found" && (
              <div className="mt-3 rounded-md bg-red-100 p-2 text-xs text-red-800">
                <p className="font-medium">Quick fix:</p>
                <ol className="mt-1 list-inside list-decimal space-y-1">
                  <li>Open your Supabase dashboard</li>
                  <li>Go to SQL Editor</li>
                  <li>
                    Run the migration file:{" "}
                    <code className="rounded bg-red-200 px-1">
                      202501270001_create_tasks_table.sql
                    </code>
                  </li>
                </ol>
              </div>
            )}
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === "development" && error && (
              <details className="mt-3 rounded-md bg-red-100 p-2 text-xs text-red-800">
                <summary className="cursor-pointer font-medium">
                  Debug info (dev only)
                </summary>
                <pre className="mt-2 overflow-auto text-[10px]">
                  {JSON.stringify(
                    {
                      message: error.message,
                      code: error.code,
                      details: error.details,
                      hint: error.hint,
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            )}
          </div>
        )}
        {!error && (!tasks || tasks.length === 0) && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              No tasks found yet. Add some rows to the{" "}
              <code className="rounded bg-amber-100 px-1">tasks</code> table in
              Supabase to see them here.
            </p>
          </div>
        )}
        {!error && tasks && tasks.length > 0 && (
          <ul className="mt-3 space-y-2 text-sm">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 transition-colors hover:bg-zinc-50"
              >
                <span className="text-zinc-900">{task.title}</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-zinc-700">
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
