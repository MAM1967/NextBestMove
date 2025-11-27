# NextBestMove Backlog

This Markdown backlog mirrors the GitHub-ready stories so we can start executing without ticket overhead.  
Use the checkboxes to track progress (✅ = done, 🔄 = in progress, ⏱ = blocked/to-do).

---

## 0. Final Inputs Needed

- [ ] Confirm Stripe pricing (plan name + amount) and launch date
- [ ] Provision Google Cloud + Azure OAuth credentials for calendar access
- [ ] Supabase project + environment variables available (service role, anon key, Stripe secrets)

---

## 🔴 P0 – MVP Must-Haves

### Foundation & Billing

- [ ] **Project initialization & tooling**  
       _Next.js 14 + TypeScript, Tailwind tokens, ESLint/Prettier, React Query, Zustand scaffold_

- [ ] **Supabase schema & migrations**  
       _All core tables (users, pins, actions, plans, summaries, calendar, billing) + enums, RLS, helper functions_

- [ ] **Stripe API routes (checkout & portal)**  
       _`POST /api/billing/create-checkout-session`, `POST /api/billing/customer-portal`, env wiring_

- [ ] **Stripe webhook + subscription sync**  
       _Verify signature, store events, upsert `billing_customers` / `billing_subscriptions`, update session status_

- [x] **Supabase Auth pages & profile bootstrap** ✅  
       _Sign up / sign in, default timezone + streak info stored on user record_

- [ ] **Paywall middleware & base overlay**  
       _Read-only mode when subscription inactive, PaywallOverlay renders on gated pages_

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

- [ ] **Make action priority ranking obvious to users**  
       _Priority scoring works but ordering logic is not clear. Add visual indicators (priority badges, urgency indicators), tooltips explaining why actions are prioritized, or sorting options. Users should understand why actions appear in the order they do._

- [ ] **Stale actions insight & algorithm v2**  
       _Surface actions older than 7 days that remain in NEW state (not snoozed). Provide insight/report UI, and update plan-generation algorithm documentation to “v2” once implemented._

### Calendar Integration

- [ ] **Google & Outlook OAuth flows**  
       _Connect/disconnect endpoints, token storage, error handling, optional skip_

- [ ] **Free/busy API + status indicators**  
       _Cached free/busy fetch, fallback to default capacity, Settings status block, disconnect action_

### Weekly Summary & Content

- [ ] **Weekly summary metrics job**  
       _Aggregate stats, placeholder narrative/insight/content prompts, schedule job_

- [ ] **Weekly Summary page**  
       _Metrics grid, narrative card, insight, focus confirmation, content prompts section_

- [ ] **Content prompt generation**  
       _Template + AI fallback for win/insight posts, saved to `content_prompts` table_

### Onboarding

- [ ] **Onboarding flow (6 steps)**  
       _Welcome → pin → optional calendar → weekly focus → first plan ready → fast win coaching_

### Settings & Export

- [ ] **Settings page framework**  
       _Sections for calendar, notifications, timezone, content prompts, streak, data export_

- [ ] **Billing section UI**  
       _BillingSection component showing plan, status badge, renewal date, manage billing CTA_

- [ ] **Data export endpoint**  
       _Download JSON of pins/actions/plans/summaries + button in Settings_

### Background Jobs & Observability

- [ ] **Background jobs**  
       _Daily plan cron, weekly summary cron, auto-unsnooze, auto-archive (Supabase or Vercel Cron)_

- [ ] **Observability setup**  
       _Sentry, analytics events (PostHog/Mixpanel), logging for billing + webhooks_

---

## 🟠 P1 – High Value Enhancements

- [ ] **Notification preferences wiring** (morning plan, fast win reminder, follow-up alerts, weekly summary)
- [ ] **Paywall analytics & copy polish** (trial/past-due variants, event tracking)
- [ ] **Past-due & cancellation banners** (dashboard alerts with billing portal CTA)
- [ ] **Adaptive recovery & celebration flows** (low completion micro-plan, 7+ day comeback, high completion boost)
- [ ] **Content Ideas list page** (saved prompts CRUD + empty state)

---

## 🟡 P2 – Nice-to-Have / v0.2 Candidates

- [ ] Manual “Busy / Light day” capacity override
- [ ] Action detail modal / history view
- [ ] Additional login providers (Apple, LinkedIn, etc.)
- [ ] Deeper analytics (deal progression metric, more insights)
- [ ] Notification delivery channels (email/push) beyond toggles

---

## Launch Hardening

- [ ] Full QA + accessibility sweep
- [ ] Production Stripe smoke test (checkout → webhook → paywall release)
- [ ] Documentation cleanup & release checklist

---

_Update this file as the source of truth until we transition to GitHub Issues or another tracker._
