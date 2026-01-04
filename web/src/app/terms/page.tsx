export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-8">
          <a
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-700"
          >
            ← Back to Home
          </a>
        </div>
        
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-semibold tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-zinc-500">
            Effective Date: November 30, 2025
          </p>
          <p className="text-sm text-zinc-500">
            Company: MAM Growth Strategies LLC
          </p>
          <p className="text-sm text-zinc-500">
            Contact: <a href="mailto:admin@nextbestmove.app" className="text-zinc-700 hover:underline">admin@nextbestmove.app</a>
          </p>
        </div>
        
        <div className="space-y-8 text-zinc-700">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">1. Acceptance of Terms</h2>
            <p className="text-zinc-600">
              By creating an account, accessing, or using NextBestMove (&quot;the Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree, you may not use the Service. You must be 18 years or older to use NextBestMove.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">2. Description of the Service</h2>
            <p className="text-zinc-600">
              NextBestMove is an online platform that helps fractional executives and independent professionals manage daily revenue activities, track relationship-based &quot;pins,&quot; receive follow-up reminders, and generate weekly summaries and content prompts. The Service includes daily plans, optional Google or Outlook calendar integration, storage of user-added &quot;pins,&quot; AI-assisted insights, Supabase data storage, and Stripe payment processing.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">3. Accounts and Security</h2>
            <p className="text-zinc-600">
              You must provide accurate information and safeguard your login credentials. MAM Growth Strategies LLC is not liable for unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">4. Subscription, Billing, and Auto-Renewal</h2>
            <p className="text-zinc-600">
              NextBestMove offers a 14-day free trial with no credit card required. Paid plans auto-renew monthly or annually via Stripe. By subscribing, you authorize recurring charges. Cancellations apply to the next billing cycle. Annual plans are non-refundable unless required by law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">5. Trial Expiration</h2>
            <p className="text-zinc-600">
              If your Standard trial ends and you do not upgrade, your account will be downgraded to the Free tier. You can still use manual planning and basic features, but automatic daily plans and calendar-aware capacity require Standard - Decision Automation. Data remains stored until deleted by you.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">6. Refunds</h2>
            <p className="text-zinc-600">
              NextBestMove does not offer refunds except where required by law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">7. User Content and License</h2>
            <p className="text-zinc-600">
              You retain full ownership of all data you provide (&quot;User Content&quot;). You grant MAM Growth Strategies LLC a limited license to store and process data solely to provide the Service. You may delete your data anytime.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">8. AI-Generated Content</h2>
            <p className="text-zinc-600">
              NextBestMove uses templates and AI services (including OpenAI) to generate summaries, insights, and drafts. AI outputs may be inaccurate and require review. AI-generated outputs belong to you and are stored in your account.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">9. Acceptable Use</h2>
            <p className="text-zinc-600">
              You agree not to misuse the Service, engage in illegal activity, or reverse-engineer any part of the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">10. Calendar Integrations</h2>
            <p className="text-zinc-600">
              Google/Outlook calendar connections are optional. Only free/busy availability is accessed.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">11. Data Storage</h2>
            <p className="text-zinc-600">
              User data is stored securely on Supabase. Availability is not guaranteed.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">12. Third-Party Providers</h2>
            <p className="text-zinc-600">
              We use Stripe, Supabase, OpenAI, and Google/Outlook integrations. Data is not sold to advertisers.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">13. Termination</h2>
            <p className="text-zinc-600">
              You may close your account anytime. We may suspend accounts that violate Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">14. Disclaimer of Warranties</h2>
            <p className="text-zinc-600">
              The Service is provided &quot;as-is&quot; without warranties of any kind.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">15. Limitation of Liability</h2>
            <p className="text-zinc-600">
              MAM Growth Strategies LLC is not liable for indirect damages. Liability is limited to the amount paid in the last six months.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">16. Dispute Resolution (Hybrid)</h2>
            <ol className="ml-6 list-decimal space-y-2 text-zinc-600">
              <li>Informal resolution by emailing <a href="mailto:admin@nextbestmove.app" className="text-zinc-900 hover:underline">admin@nextbestmove.app</a></li>
              <li>Binding arbitration (AAA)</li>
              <li>Either party may seek injunctive relief or enforcement in New York courts</li>
            </ol>
            <p className="mt-2 text-zinc-600">
              Class actions are not permitted.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">17. Governing Law</h2>
            <p className="text-zinc-600">
              These Terms are governed by New York law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">18. Changes to Terms</h2>
            <p className="text-zinc-600">
              We may update Terms over time. Continued use indicates acceptance.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-zinc-900">19. Contact</h2>
            <p className="text-zinc-600">
              <a href="mailto:admin@nextbestmove.app" className="text-zinc-900 hover:underline">admin@nextbestmove.app</a>
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

