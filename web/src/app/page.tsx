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
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Built for fractional CMOs
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
              The operating system for{" "}
              <span className="underline decoration-sky-400 decoration-2 underline-offset-4">
                fractional CMOs
              </span>
              .
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600">
              Clarity across every client. One weekly rhythm. One{" "}
              <span className="underline decoration-sky-400 decoration-2 underline-offset-4">
                next best move
              </span>{" "}
              per account. NextBestMove is a structured workspace for fractional
              CMOs and small agencies who manage multiple clients. It eliminates
              priority fog, context switching, and fragile manual systems that
              break as you scale.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {!launched ? (
                <>
                  <a
                    href="/early-access"
                    className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50"
                  >
                    Get early access
                  </a>
                </>
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
                    className="inline-flex items-center text-sm font-medium text-zinc-900"
                  >
                    Sign in
                  </a>
                </>
              )}
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Designed for multi-client engagements, retainers, and fractional
              leadership work.
            </p>
          </div>

          {/* "See how it works" style visual in hero */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 lg:p-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Weekly client view
            </p>
            <h2 className="mt-2 text-sm font-semibold text-zinc-900">
              One screen. Every client. Weekly clarity.
            </h2>
            <div className="mt-4 space-y-3">
              {["Client Alpha", "Client Bravo", "Client Charlie"].map(
                (client, idx) => (
                  <div
                    key={client}
                    className="flex items-start justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-3"
                  >
                    <div>
                      <p className="text-xs font-semibold text-zinc-900">
                        {client}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                        Next best move
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {idx === 0 &&
                          "Align Q3 narrative and campaign brief with sales."}
                        {idx === 1 &&
                          "Refine ICP and core messaging for clearer focus."}
                        {idx === 2 &&
                          "Tighten reporting cadence to highlight weekly wins."}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-col items-end gap-1">
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-700 ring-1 ring-zinc-200">
                        In focus this week
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Updated Mon
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Built for your work / Problem */}
        <section className="mt-16 border-t border-zinc-200 pt-10 sm:mt-20 sm:pt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Built for your work
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Fractional work breaks without an operating system.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600">
            When you&apos;re responsible for multiple client engagements, the
            problem isn&apos;t just more work — it&apos;s the lack of a
            reliable weekly rhythm. Three things show up fast:
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Priority fog
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Too many requests, unclear direction, and constant re-sorting of
                what matters this week.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Momentum risk
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Clients expect visible progress every seven days. If they don&apos;t
                feel it, they start questioning the engagement.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Context switching loss
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Jumping between 4–8 accounts destroys focus and wastes hours in
                mental reload.
              </p>
            </div>
          </div>
        </section>

        {/* What NBM gives you */}
        <section className="mt-16 border-t border-zinc-200 pt-10 sm:mt-20 sm:pt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            What NextBestMove gives you.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600">
            One view. Every client. Every week.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Weekly priority moves",
                body: "See the single most important action for each client — the move that creates visible progress.",
              },
              {
                title: "Momentum tracking",
                body: "Track weekly movement across all accounts so you always know who's moving and who's at risk.",
              },
              {
                title: "Client-ready summaries",
                body: "Generate clean, understandable updates in minutes, not hours.",
              },
              {
                title: "Unified client workspace",
                body: "Keep priorities, notes, and commitments in one place instead of scattered across tools.",
              },
              {
                title: "Decision engine",
                body: "Cut through noise and choose the next best move without overthinking.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4"
              >
                <p className="text-sm font-semibold text-zinc-900">
                  {item.title}
                </p>
                <p className="mt-2 text-sm text-zinc-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly OS */}
        <section className="mt-16 border-t border-zinc-200 pt-10 sm:mt-20 sm:pt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            The weekly OS behind NextBestMove.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600">
            A simple rhythm that turns fractional work from reactive to
            predictable.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                01 · Monday clarity reset
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Set the next best move for every client so the week starts with
                direction, not guesswork.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                02 · Midweek momentum check
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                See how the week is unfolding across accounts and
                course-correct early.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                03 · Friday summary
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Close the loop with client-ready summaries that show exactly
                what moved and what&apos;s next.
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-xs text-zinc-500 sm:text-sm">
            The manual version of this system already works. NextBestMove
            automates it.
          </p>
        </section>

        {/* Designed by operators + Who it's for + mini diagram */}
        <section className="mt-16 border-t border-zinc-200 pt-10 sm:mt-20 sm:pt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Designed by operators, not theory.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600">
            NextBestMove comes from the realities of running multi-client work —
            juggling priorities, managing momentum, and keeping several
            engagements moving without burning out. It's built from the
            operating patterns that actually hold up under real client pressure,
            not hypothetical workflows.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr,1fr]">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Who it's for
              </p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                <li>• Fractional CMOs</li>
                <li>• 2–3 person marketing agencies</li>
                <li>• Independent operators managing multiple client accounts</li>
                <li>• Consultants running weekly retainers</li>
              </ul>
            </div>

            {/* See how it works diagram */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                See how it works
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                One screen showing every client, their current priority move,
                and the momentum you&apos;re creating week to week.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  { client: "Alpha", move: "Align Q3 narrative." },
                  { client: "Bravo", move: "Fix lead → opp handoff." },
                  { client: "Charlie", move: "Tighten reporting cadence." },
                ].map((item) => (
                  <div
                    key={item.client}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"
                  >
                    <p className="text-[11px] font-semibold text-zinc-900">
                      Client
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-600">
                      {item.client}
                    </p>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      Move
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-600">
                      {item.move}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-16 border-t border-zinc-200 pt-10 sm:mt-20 sm:pt-14">
          <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-8 shadow-sm sm:px-8 sm:py-10">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Start your week with clarity.
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-zinc-600">
              Join the early access group shaping the operating system for
              fractional work. Run multiple clients with a calm, predictable
              weekly rhythm.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
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
                    className="text-sm font-medium text-zinc-900"
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
