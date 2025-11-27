# NextBestMove – Working Agreements

This living document captures team-level decisions that guide how we build and ship the MVP. Update it whenever we revisit an agreement (e.g., hybrid auth, CI upgrades).

---

## 1. Definition of Done
- Code changes live behind a pull request with at least one review (self-review acceptable for solo work, but checklist must be completed).
- Automated checks pass: lint, type checks, unit tests and any integration/UI suites covering the change.
- Feature flagged or env-configured when risky; migrations or config changes documented in the PR.
- Deployed to staging (Vercel preview) with a quick smoke test noted in PR comments.
- Monitoring hooks in place: console logging + Sentry capture + analytics events for the new surface.
- Relevant docs updated (README snippets, `/docs/*`, backlog entries) so new contributors have up-to-date guidance.

---

## 2. Architecture & Tech Stack (summary)
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS (design tokens from UI spec).
- **Backend/API**: Next.js API routes + React Server Components; Supabase provides DB/auth/storage/cron.
- **Database**: Supabase PostgreSQL with RLS, migrations in repo.
- **Auth**: Supabase Auth (email/password) for identity; Google/Outlook OAuth strictly for calendar data.
- **Payments**: Stripe Checkout + Billing Portal, webhook handlers in API routes, billing tables stored in Supabase.
- **Observability**: Sentry for errors, PostHog/Mixpanel for product analytics, structured logging via Vercel/Supabase dashboards.
- **Hosting**: Vercel (frontend/API) + Supabase (DB/storage/functions/cron).
- **Frontend ↔ Backend**: React Query → REST-ish `/api/*` endpoints; server code uses Supabase service client + Stripe SDK.
See `/docs/Architecture/Implementation_Guide.md` for deeper implementation details.

---

## 3. Environments & Tooling
- **Version control**: GitHub (`main` protected; feature branches via PRs).
- **Package manager**: `pnpm` (preferred) or `npm` consistently across developers.
- **Environments**:
  - Local dev (Next.js dev server + Supabase local or dev project)
  - Staging (Vercel preview + Supabase staging project or schema)
  - Production (Vercel prod + Supabase prod)
- **CI/CD**:
  - Phase 1: GitHub Actions running lint + type-check + tests on every PR.
  - Phase 2 (post-MVP team): add integration/UI suites + automated preview deploy comments.
- **Deploy workflow**:
  - PR merge triggers Vercel production deploy.
  - Supabase migrations applied via GitHub Action or manual `supabase db push`.

---

## 4. Lean Test Strategy
- **Unit tests**: core business logic (plan generation, summary aggregation, Stripe helpers) with fast feedback.
- **Integration tests**: API routes that touch Supabase/Stripe, using mocks or test projects in CI.
- **UI/End-to-end smoke tests** (Playwright/Cypress minimal set):
  1. Onboarding (signup → pin → plan view)
  2. Daily plan interaction (mark done, follow-up flow)
  3. Billing happy path (subscribe → paywall unlock)
- **Manual smoke checklist** before release: calendar connect, plan generation, weekly summary run, Stripe checkout trial.
- **Critical journeys that must always pass**:
  - Pin creation → daily plan generation
  - Follow-up flow & snooze logic
  - Weekly summary generation + focus confirmation
  - Stripe checkout → paywall gating
  - Calendar connect/disconnect recovery

---

_Last updated: 2025-11-26_

