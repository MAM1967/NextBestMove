import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignalsClient } from "./SignalsClient";

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
          Email signals and contextual triggers from your conversations that may warrant new actions.
        </p>
      </header>

      <SignalsClient />
    </div>
  );
}

