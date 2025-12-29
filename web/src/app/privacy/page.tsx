import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-700"
          >
            ← Back to Home
          </Link>
        </div>
        
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-semibold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-zinc-500">
            Effective Date: November 30, 2025
          </p>
          <p className="text-sm text-zinc-500">
            Company: MAM Growth Strategies LLC
          </p>
        </div>
        
        <div className="space-y-8 text-zinc-700">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">1. What This Policy Covers</h2>
            <p className="text-zinc-600">
              This Privacy Policy explains how NextBestMove collects, uses, stores, and protects personal information.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">2. Information We Collect</h2>
            <div className="space-y-3 text-zinc-600">
              <p>
                <strong className="text-zinc-900">A. Information You Provide:</strong><br />
                Name, email, password (encrypted), pins (names, URLs, notes), user-generated content, AI-generated content.
              </p>
              <p>
                <strong className="text-zinc-900">B. Optional Calendar Data:</strong><br />
                Free/busy time only. No event details accessed.
              </p>
              <p>
                <strong className="text-zinc-900">C. Automatic Data:</strong><br />
                Log data, device info, analytics, cookies.
              </p>
              <p>
                <strong className="text-zinc-900">D. Third-Party Payment Data:</strong><br />
                Handled securely by Stripe.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">3. How We Use Information</h2>
            <p className="text-zinc-600">
              To provide core functionality, generate daily plans, produce summaries, generate AI outputs, process payments, ensure security, and comply with laws. We do not sell personal data.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">4. AI Usage</h2>
            <p className="text-zinc-600">
              NextBestMove uses AI providers (including OpenAI). Your data is processed only to provide features. Outputs are stored in your account and belong to you.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">5. Data Storage & Retention</h2>
            <p className="text-zinc-600">
              Data stored via Supabase. Deleted user accounts are fully removed within 30 days unless legally required otherwise.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">6. Sharing of Information</h2>
            <p className="text-zinc-600">
              Shared only with essential providers: Supabase, Stripe, OpenAI, analytics tools. Not shared with advertisers.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">7. Cookies & Analytics</h2>
            <p className="text-zinc-600">
              Google Analytics and essential cookies may be used. EU users may see a cookie banner.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">8. Children&apos;s Privacy</h2>
            <p className="text-zinc-600">
              Service is not for individuals under 18.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">9. Security</h2>
            <p className="text-zinc-600">
              Industry-standard security measures used, but no system is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">10. User Rights</h2>
            <p className="text-zinc-600">
              You may access, delete, export, or correct your data. Email <a href="mailto:admin@nextbestmove.app" className="text-zinc-900 hover:underline">admin@nextbestmove.app</a>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">11. Account Deletion</h2>
            <p className="text-zinc-600">
              You may delete your account anytime; data removed within 30 days.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">12. International Transfers</h2>
            <p className="text-zinc-600">
              By using the Service, you consent to U.S. data processing.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">13. Changes to This Policy</h2>
            <p className="text-zinc-600">
              We may update this Policy. Significant changes will be communicated.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">14. Contact</h2>
            <p className="text-zinc-600">
              Privacy inquiries: <a href="mailto:admin@nextbestmove.app" className="text-zinc-900 hover:underline">admin@nextbestmove.app</a>
            </p>
            <p className="text-zinc-600">
              Support: <a href="mailto:admin@nextbestmove.com" className="text-zinc-900 hover:underline">admin@nextbestmove.com</a>
            </p>
            <p className="text-zinc-600">
              Address: 1 River Place #2108, New York, NY 10036
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

