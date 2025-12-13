// Launch date: January 13, 2026 12:00 AM ET
const LAUNCH_DATE = new Date('2026-01-13T05:00:00Z'); // Jan 13, 2026 12:00 AM ET = 5:00 AM UTC

function isLaunched(): boolean {
  return new Date() >= LAUNCH_DATE;
}

export default function MarketingHome() {
  const launched = isLaunched();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            {/* Simple brand mark placeholder */}
            <div className="h-6 w-6 rounded-md bg-black" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              NextBestMove
            </span>
          </div>
          <div className="flex items-center gap-3">
            {launched && (
              <a
                href="/auth/sign-in"
                className="inline-flex items-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800"
              >
                Sign in
              </a>
            )}
            {!launched && (
              <a
                href="/early-access"
                className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50"
              >
                Get early access
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        {/* Hero */}
        <section className="text-center">
          <div className="mx-auto max-w-3xl">
            {!launched && (
              <span className="inline-block rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm">
                Early Access
              </span>
            )}
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              Stop juggling relationships in your head.
            </h1>
            <p className="mt-4 text-xl leading-relaxed text-zinc-600">
              The operating system for independent operators who need clarity, not more dashboards.
            </p>
            <p className="mt-3 text-base text-zinc-600">
              Plan your day. Act with intention. Move relationships forward.
            </p>
            <div className="mt-6 flex justify-center">
              {!launched ? (
                <a
                  href="/early-access"
                  className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50"
                >
                  Get early access
                </a>
              ) : (
                <>
                  <a
                    href="/auth/sign-up"
                    className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50"
                  >
                    Get started
                  </a>
                  <a
                    href="/auth/sign-in"
                    className="ml-3 inline-flex items-center text-sm font-medium text-zinc-900"
                  >
                    Sign in
                  </a>
                </>
              )}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-16 border-t border-zinc-200 pt-10 sm:mt-20 sm:pt-14">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              How it works
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              A simple loop that builds momentum.
            </h2>
            <p className="mt-3 mx-auto max-w-2xl text-base leading-relaxed text-zinc-600">
              Six steps. Repeatable daily. Builds clarity and follow-through.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                number: "1",
                title: "Today",
                body: "See what deserves your attention right now, without noise or clutter.",
              },
              {
                number: "2",
                title: "Relationships",
                body: "Keep context on the people you work with so follow-through is natural.",
              },
              {
                number: "3",
                title: "Daily Plan",
                body: "Choose what you will do today. Make your intentions explicit.",
              },
              {
                number: "4",
                title: "Actions",
                body: "Take concrete next steps. Turn context into movement.",
              },
              {
                number: "5",
                title: "Signals",
                body: "Notice external events that create opportunities for timely action.",
              },
              {
                number: "6",
                title: "Weekly Review",
                body: "Reflect, recalibrate, and set your focus for the week ahead.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="relative rounded-2xl border border-zinc-200 bg-white p-6"
              >
                <div className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-600">
                  {item.number}
                </div>
                <h3 className="pr-8 text-lg font-semibold text-zinc-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Who it's for */}
        <section className="mt-16 border-t border-zinc-200 pt-10 sm:mt-20 sm:pt-14">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Who it&apos;s for
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Built for independent operators.
            </h2>
            <p className="mt-3 mx-auto max-w-2xl text-base leading-relaxed text-zinc-600">
              If your work depends on relationships, timing, and judgment—this is for you.
            </p>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">Who this fits</h3>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                <li>• Solopreneurs building businesses one relationship at a time</li>
                <li>• Fractional executives juggling multiple clients</li>
                <li>• Consultants and advisors managing dozens of threads</li>
                <li>• Anyone whose success depends on thoughtful follow-through</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">What you get</h3>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                <li>• Clarity on what matters today</li>
                <li>• Context that makes follow-through effortless</li>
                <li>• A system that learns your rhythm</li>
                <li>• Weekly momentum instead of daily chaos</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Why this works */}
        <section className="mt-16 border-t border-zinc-200 pt-10 sm:mt-20 sm:pt-14">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Why this works
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Why this works.
            </h2>
            <p className="mt-3 mx-auto max-w-2xl text-base leading-relaxed text-zinc-600">
              Independent operators don&apos;t need more features. They need less friction.
            </p>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {[
              {
                title: "Designed for how you think",
                body: "Your work isn't linear. It's relationship-driven, context-heavy, and timing-dependent. NextBestMove maps to that reality.",
              },
              {
                title: "Intentional, not reactive",
                body: "Choose what you'll do today, not what your inbox tells you to do. Act with purpose, not urgency.",
              },
              {
                title: "Context at your fingertips",
                body: "Remember the details that matter. Know where you left off. Pick up conversations naturally.",
              },
              {
                title: "Close the loop",
                body: "Weekly reviews turn experience into learning. You don't just do more—you get better.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6"
              >
                <h3 className="text-lg font-semibold text-zinc-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-600">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <h3 className="text-xl font-semibold text-zinc-900">
              Designed for a specific kind of work.
            </h3>
            <p className="mt-2 text-base text-zinc-600">
              NextBestMove is intentionally opinionated.
            </p>
            <div className="mt-8 space-y-4">
              {[
                {
                  label: "Over-structured systems",
                  text: "Built for teams and rigid processes. Powerful, but they slow down independent, relationship-driven work.",
                },
                {
                  label: "Open-ended workspaces",
                  text: "Flexible, but easy to over-organize. You spend time shaping the system instead of acting.",
                },
                {
                  label: "Pure reflection tools",
                  text: "Great for thinking and journaling. Not built to carry context forward or surface timely next steps.",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 text-left"
                >
                  <h4 className="text-lg font-semibold text-zinc-900">
                    {item.label}
                  </h4>
                  <p className="mt-2 text-sm text-zinc-600">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <p className="text-base text-zinc-900">
                NextBestMove sits in between.
              </p>
              <p className="mt-2 text-base text-zinc-600">
                It gives you just enough structure to act consistently, without asking you to manage a system.
              </p>
            </div>
          </div>
        </section>


        {/* Final CTA */}
        <section className="mt-16 border-t border-zinc-200 pt-10 sm:mt-20 sm:pt-14">
          <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-8 text-center shadow-sm sm:px-8 sm:py-10">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Stay focused. Take the right actions. Build momentum.
            </h2>
            <p className="mt-3 mx-auto max-w-xl text-base leading-relaxed text-zinc-600">
              Join independent operators getting early access to NextBestMove.
            </p>
            <div className="mt-6 flex justify-center">
              {!launched ? (
                <a
                  href="/early-access"
                  className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50"
                >
                  Get early access
                </a>
              ) : (
                <>
                  <a
                    href="/auth/sign-up"
                    className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50"
                  >
                    Get started
                  </a>
                  <a
                    href="/auth/sign-in"
                    className="ml-3 text-sm font-medium text-zinc-900"
                  >
                    Already have access? Sign in
                  </a>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Copyright © MAM Growth Strategies LLC 2025</p>
          <div className="flex flex-wrap items-center gap-4">
            <a href="/terms" className="hover:text-zinc-900">
              Terms of Service
            </a>
            <a href="/privacy" className="hover:text-zinc-900">
              Privacy Policy
            </a>
            <span className="text-zinc-500">
              This site uses privacy-friendly analytics.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
