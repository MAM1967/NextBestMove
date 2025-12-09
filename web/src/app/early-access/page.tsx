import { EarlyAccessForm } from "./EarlyAccessForm";

export default function EarlyAccessPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Get early access
            </h1>
            <p className="mt-3 text-base leading-relaxed text-zinc-600">
              Join the early access group shaping the operating system for
              fractional work. We'll reach out personally with access details and
              a short onboarding.
            </p>
          </div>
          <EarlyAccessForm />
        </div>
      </div>
    </div>
  );
}

