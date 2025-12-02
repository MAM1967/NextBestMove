import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FeedbackForm } from "./FeedbackForm";

export default async function FeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?redirect=/app/feedback");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">
          What didn't work for you?
        </h1>
        <p className="mb-6 text-sm text-zinc-600">
          We'd love to hear your feedback. Your input helps us improve NextBestMove.
        </p>
        <FeedbackForm />
      </div>
    </div>
  );
}

