import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  // Note: We don't redirect authenticated users here because
  // Supabase sets a session when the user clicks the reset link,
  // and we need that session to update the password

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Set new password
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Enter your new password below
          </p>
        </div>

        {params.message && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {params.message}
          </div>
        )}

        <ResetPasswordForm />
      </div>
    </div>
  );
}

