# NextBestMove Backlog

This Markdown backlog mirrors the GitHub-ready stories so we can start executing without ticket overhead.  
Use the checkboxes to track progress (✅ = done, 🔄 = in progress, ⏱ = blocked/to-do).

---

## 0. Final Inputs Needed

- [x] Confirm Stripe pricing (plan name + amount) and launch date ✅  
       _Standard: $29/mo or $249/year | Professional: $79/mo or $649/year | 14-day free trial (no credit card)_
- [ ] Provision Google Cloud + Azure OAuth credentials for calendar access
- [ ] Supabase project + environment variables available (service role, anon key, Stripe secrets)

---

## 🔴 P0 – MVP Must-Haves

### Foundation & Billing

- [ ] **Project initialization & tooling**  
       _Next.js 14 + TypeScript, Tailwind tokens, ESLint/Prettier, React Query, Zustand scaffold_

- [ ] **Supabase schema & migrations**  
       _All core tables (users, pins, actions, plans, summaries, calendar, billing) + enums, RLS, helper functions_

- [x] **Stripe API routes (checkout & portal)** ✅  
       _`POST /api/billing/create-checkout-session` (support Standard/Professional plans, monthly/annual), `POST /api/billing/customer-portal`, env wiring. Support 14-day trial creation via Stripe API (no credit card required, `trial_period_days: 14`)_

- [x] **Stripe webhook + subscription sync** ✅  
       _Verify signature, store events, upsert `billing_customers` / `billing_subscriptions`, update session status. Handle trial expiration (via `customer.subscription.updated` when trial ends), payment failures, cancellations, and plan upgrades/downgrades. Stripe automatically manages trial status transitions_

- [x] **Supabase Auth pages & profile bootstrap** ✅  
       _Sign up / sign in, default timezone + streak info stored on user record_

- [x] **Paywall middleware & base overlay** ✅  
       _Read-only mode when subscription inactive, PaywallOverlay renders on gated pages. Support 14-day trial (full access), 7-day read-only grace period, and plan-based feature gating (Standard vs Professional). PaywallOverlay component created, subscription status checking implemented, plan page protected_

### Pins & Actions

- [x] **Pin management UI + API** ✅  
       _Pin CRUD endpoints, filters (All/Active/Snoozed/Archived), Add/Edit modals, Snooze/Archive/Restore_

- [x] **Action engine core** ✅  
       _Action card component, Done/Got reply/Snooze handlers, FollowUpFlowModal + scheduling defaults_

### Daily Plan

- [x] **Plan generation service** ✅  
       _Capacity calculation, Fast Win selection, priority scoring, `daily_plan_actions` writes_

- [x] **Daily Plan page UI** ✅  
       _Header, focus card, progress indicator, Fast Win card, action list, empty state_

- [x] **Make action priority ranking obvious to users** ✅  
       _Priority scoring works but ordering logic is not clear. Add visual indicators (priority badges, urgency indicators), tooltips explaining why actions are prioritized, or sorting options. Users should understand why actions appear in the order they do._

- [x] **Stale actions insight & algorithm v2** ✅  
       _Surface actions older than 7 days that remain in NEW state (not snoozed). Provide insight/report UI, and update plan-generation algorithm documentation to "v2" once implemented._

### Calendar Integration

- [x] **Google & Outlook OAuth flows** ✅  
       _Connect/disconnect endpoints, token storage, error handling, optional skip_

- [x] **Free/busy API + status indicators** ✅  
       _Cached free/busy fetch, fallback to default capacity, Settings status block, disconnect action_

- [ ] **Customizable working hours (onboarding preference)**  
       _Allow users to set their working hours (e.g., 9-5, 10-6, 8-8) during onboarding. Currently hardcoded to 9 AM - 5 PM. This is a STANDARD feature (not premium) because it's core functionality - the app won't work correctly for many users without it. Similar to timezone - a fundamental configuration setting. Store in `users` table as `work_start_hour` and `work_end_hour` (integers 0-23). Update capacity calculation and calendar events filtering to use custom hours._

### Weekly Summary & Content

- [ ] **Weekly summary metrics job**  
       _Aggregate stats, placeholder narrative/insight/content prompts, schedule job_

- [x] **Weekly Summary page** ✅  
       _Metrics grid, narrative card, insight, focus confirmation, content prompts section_

- [ ] **Content prompt generation**  
       _Template + AI fallback for win/insight posts, saved to `content_prompts` table_

- [x] **Copy to clipboard for content prompts** ✅  
       _Add "Copy to clipboard" button for content prompts on Weekly Summary page_

### Onboarding

- [ ] **Onboarding flow (8 steps)**  
       _Welcome → pin → optional calendar → working hours → weekend preference → weekly focus → first plan ready → fast win coaching → start 14-day trial (no credit card). No early pricing screens - let rhythm sell the plan_

### Settings & Export

- [x] **Settings page framework** ✅  
       _Sections for calendar, notifications, timezone, content prompts, streak, data export_

- [x] **Billing section UI** ✅  
       _BillingSection component showing plan, status badge, renewal date, manage billing CTA_

- [ ] **Data export endpoint**  
       _Download JSON of pins/actions/plans/summaries + button in Settings_

- [ ] **Email preferences & account deletion controls**  
       _Add placeholder UI + backend hooks for unsubscribe, weekly insights report opt-in, productivity tips toggle (future), and “Delete my account”. High P1 – required to meet compliance expectations._

### Background Jobs & Observability

- [ ] **Background jobs**  
       _Daily plan cron, weekly summary cron, auto-unsnooze, auto-archive (Supabase or Vercel Cron)_

- [ ] **Observability setup**  
       _Sentry, analytics events (PostHog/Mixpanel), logging for billing + webhooks_

---

## 🟠 P1 – High Value Enhancements

- [x] **Account overview: Password change & timezone editing** ✅  
       _Allow users to change password and update timezone in Settings → Account overview. Timezone dropdown with common options for travelers/remote workers. Password change requires confirmation._

- [ ] **Password reset / Forgot password flow**  
       _Implement "Forgot password?" link on sign-in page, password reset email flow, and reset password page. Use Supabase `resetPasswordForEmail` and `updateUser` APIs._

- [ ] **Notification preferences wiring** (morning plan, fast win reminder, follow-up alerts, weekly summary)
- [ ] **Paywall analytics & copy polish** (trial/past-due variants, event tracking)
- [ ] **Past-due & cancellation banners** (dashboard alerts with billing portal CTA)
- [ ] **Adaptive recovery & celebration flows** (low completion micro-plan, 7+ day comeback, high completion boost)
- [ ] **Content Ideas list page** (saved prompts CRUD + empty state)
- [ ] **Trial expiration & read-only grace period** (Day 15-21: read-only mode, banner messaging, subscription prompts. Use Stripe API for trial management - lightest lift)
- [ ] **Trial reminders** (Day 12 + Day 14 email via Resend + push notifications)
- [ ] **Plan upgrade triggers** (Pin limit hit, pattern detection access, pre-call brief prompts, content engine prompts)
- [ ] **Streak break detection & recovery** (Day 1-3 push notifications, Micro Mode on Day 2, personal email via Resend on Day 3, billing pause offer on Day 7)
- [ ] **Payment failure recovery flow** (Day 0 email via Resend, Day 3 modal + email, Day 7 read-only, Day 14 archive + 30-day reactivation window)
- [ ] **Win-back campaign automation** (Day 7, 30, 90, 180 post-cancellation emails via Resend)
- [ ] **Professional plan features** (Unlimited pins + premium features in priority order: 1) Pattern detection, 2) Pre-call briefs, 3) Performance timeline, 4) Content engine with voice learning)
- [ ] **Plan downgrade handling** (Professional → Standard: pin limit warning, Standard → Cancel: 7-day read-only + 30-day reactivation)

---

## 🟡 P2 – Nice-to-Have / v0.2 Candidates

- [ ] Manual "Busy / Light day" capacity override
- [ ] Action detail modal / history view
- [ ] Additional login providers (Apple, LinkedIn, etc.)
- [ ] Deeper analytics (deal progression metric, more insights)
- [ ] Notification delivery channels (email/push) beyond toggles
- [ ] Pricing page UI (Standard vs Professional comparison, annual savings, clear value props)
- [ ] Billing pause feature (30-day pause for users inactive 7+ days)

---

## Launch Hardening

- [ ] Full QA + accessibility sweep
- [ ] Production Stripe smoke test (checkout → webhook → paywall release)
- [ ] Documentation cleanup & release checklist

---

## 💡 Future Ideas

Ideas to consider for future versions beyond MVP and initial enhancements.

- [ ] **View past summaries**  
       _Page or modal to browse historical weekly summaries, compare weeks, track progress over time_

---

_Update this file as the source of truth until we transition to GitHub Issues or another tracker._
