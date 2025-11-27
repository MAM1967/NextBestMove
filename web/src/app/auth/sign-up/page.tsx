import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignUpForm } from "./SignUpForm";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/app");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Get started with NextBestMove
          </p>
        </div>

        {params.message && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {params.message}
          </div>
        )}

        <SignUpForm />
      </div>
    </div>
  );
}
