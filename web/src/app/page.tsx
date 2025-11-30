export default function MarketingHome() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16">
        <header className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            NextBestMove
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Turn your calendar and tasks into a single{" "}
            <span className="underline decoration-sky-400 decoration-2 underline-offset-4">
              next best move
            </span>
            .
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600">
            A focused workspace that looks at your time, commitments, and energy
            so you don&apos;t have to juggle priorities alone.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-4">
          <a
            href="/auth/sign-in"
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
          >
            Sign in
          </a>
          <a
            href="/auth/sign-up"
            className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          >
            Get started
          </a>
        </div>

        <section className="grid gap-6 border-t border-zinc-200 pt-8 sm:grid-cols-3">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-zinc-900">
              Calendar-aware
            </h2>
            <p className="text-sm text-zinc-600">
              Understand your real availability by combining meetings, focus
              blocks, and personal constraints.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-zinc-900">
              Task intelligence
            </h2>
            <p className="text-sm text-zinc-600">
              Prioritize tasks by urgency, importance, and energy so you always
              know the next best move.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-zinc-900">
              Weekly insight
            </h2>
            <p className="text-sm text-zinc-600">
              See how you actually spent your time and gently course-correct for
              the week ahead.
            </p>
          </div>
        </section>

        <footer className="border-t border-zinc-200 pt-8">
          <div className="flex flex-col items-center gap-4 text-sm text-zinc-600 sm:flex-row sm:justify-between">
            <p>Copyright © MAM Growth Strategies LLC 2025</p>
            <div className="flex gap-6">
              <a
                href="/terms"
                className="hover:text-zinc-900 hover:underline"
              >
                Terms of Service
              </a>
              <a
                href="/privacy"
                className="hover:text-zinc-900 hover:underline"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
