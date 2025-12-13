import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SignalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?redirect=/app/signals");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Signals
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Signals
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600">
          External events and contextual triggers that may warrant new actions.
        </p>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
        <p className="mb-2 text-lg font-medium text-zinc-900">
          Signals coming soon
        </p>
        <p className="text-sm text-zinc-600">
          This section will show external events and contextual triggers that create opportunities for action.
        </p>
      </div>
    </div>
  );
}

