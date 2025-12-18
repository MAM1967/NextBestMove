# NextBestMove Architecture Summary

**Last Updated:** December 10, 2025  
**Purpose:** Comprehensive architecture overview for quick reference and onboarding

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Architecture Summary](#architecture-summary)
3. [Tech Stack](#tech-stack)
4. [Cron Jobs Configuration](#cron-jobs-configuration)
5. [PRD Summary](#prd-summary)
6. [Completed Backlog Summary](#completed-backlog-summary)
7. [Current Backlog](#current-backlog)

---

## Product Overview

**NextBestMove** is an actions-first workflow app that helps solopreneurs and fractional executives maintain a consistent revenue rhythm.

### Core Loop (v0.1)

1. Add leads you don't want to lose track of
2. Get a short, calendar-aware daily plan (3–8 actions)
3. Mark actions as done / got reply / snooze
4. Receive a weekly summary with a simple insight and 1–2 content prompts

### Target Users

- Fractional CMOs, CFOs, CTOs, COOs
- Solo consultants, expert freelancers
- Early-stage founders doing their own outbound

---

## Architecture Summary

### High-Level Architecture

```
┌─────────────────┐
│   Next.js App   │  (Frontend + API Routes)
│   (Vercel)      │
└────────┬────────┘
         │
         ├─── Supabase (PostgreSQL + Auth)
         ├─── Stripe (Payments)
         ├─── Google Calendar API (OAuth)
         ├─── Microsoft Graph API (OAuth)
         ├─── OpenAI API (AI features)
         ├─── Resend (Email)
         ├─── cron-job.org (Scheduled Jobs)
         ├─── GlitchTip (Error Tracking)
         └─── Umami (Analytics)
```

### Key Components

1. **Frontend**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS
2. **Backend**: Next.js API Routes + Server Components
3. **Database**: Supabase PostgreSQL with Row Level Security (RLS)
4. **Authentication**: Supabase Auth (email/password) + OAuth for calendar access only
5. **Payments**: Stripe Checkout + Billing Portal + Webhooks
6. **Scheduled Jobs**: cron-job.org (external cron service)
7. **Email**: Resend API
8. **Error Tracking**: GlitchTip (Sentry-compatible SDK)
9. **Analytics**: Umami (privacy-friendly)

---

## Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React 18
- **Styling**: Tailwind CSS (design tokens from UI spec)
- **State Management**: React Query for server state

### Backend

- **Runtime**: Node.js (Vercel Edge/Serverless)
- **API**: Next.js API Routes
- **Server Components**: React Server Components
- **Database Client**: Supabase JS Client

### Database

- **Provider**: Supabase (PostgreSQL)
- **Security**: Row Level Security (RLS) policies
- **Migrations**: SQL migration files in `supabase/migrations/`

### External Services

- **Hosting**: Vercel (frontend + API)
- **Database/Auth**: Supabase
- **Payments**: Stripe
- **Calendar**: Google Calendar API, Microsoft Graph API
- **AI**: OpenAI API (with BYOK support for Premium)
- **Email**: Resend
- **Cron Jobs**: cron-job.org (external service)
- **Error Tracking**: GlitchTip
- **Analytics**: Umami

### Environment Management

- **Secrets**: Doppler (source of truth)
- **Sync**: Doppler → Vercel (via scripts)
- **Environments**:
  - Local (`.env.local`)
  - Staging (Doppler `stg` config → Vercel Preview)
  - Production (Doppler `prd` config → Vercel Production)

---

## Cron Jobs Configuration

### Important: Using cron-job.org (NOT Vercel Cron)

All scheduled background jobs are configured via **cron-job.org**, an external cron service. Vercel Cron is NOT used.

### Authentication Method

Cron jobs authenticate using:

1. **Authorization Header**: `Authorization: Bearer ${CRON_SECRET}` or `Authorization: Bearer ${CRON_JOB_ORG_API_KEY}`
2. **Query Parameter**: `?secret=${CRON_SECRET}` (fallback for cron-job.org)

### Cron Jobs List

All cron jobs are configured in cron-job.org and call Next.js API endpoints:

1. **Daily Plans Generation**

   - Endpoint: `/api/cron/daily-plans`
   - Schedule: Daily (typically early morning UTC)
   - Purpose: Generate daily plans for all active users

2. **Weekly Summaries**

   - Endpoint: `/api/cron/weekly-summaries`
   - Schedule: Weekly (typically Sunday)
   - Purpose: Generate weekly summaries and send emails

3. **Auto-Unsnooze**

   - Endpoint: `/api/cron/auto-unsnooze`
   - Schedule: Daily
   - Purpose: Automatically unsnooze items past their snooze date

4. **Auto-Archive**

   - Endpoint: `/api/cron/auto-archive`
   - Schedule: Daily
   - Purpose: Archive old completed actions

5. **Morning Plan Emails**

   - Endpoint: `/api/notifications/morning-plan`
   - Schedule: Hourly (to catch 8am in user timezones)
   - Purpose: Send morning plan emails at 8am user time

6. **Fast Win Reminders**

   - Endpoint: `/api/notifications/fast-win-reminder`
   - Schedule: Hourly (to catch 2pm in user timezones)
   - Purpose: Send fast win reminder emails at 2pm user time

7. **Follow-Up Alerts**

   - Endpoint: `/api/notifications/follow-up-alerts`
   - Schedule: Daily
   - Purpose: Alert users about overdue follow-up actions

8. **Streak Recovery**

   - Endpoint: `/api/cron/streak-recovery`
   - Schedule: Daily
   - Purpose: Detect streak breaks and send recovery emails

9. **Payment Failure Recovery**

   - Endpoint: `/api/cron/payment-failure-recovery`
   - Schedule: Daily
   - Purpose: Handle payment failure recovery flow (Day 0, 3, 7, 14)

10. **Win-Back Campaign**

    - Endpoint: `/api/cron/win-back-campaign`
    - Schedule: Daily
    - Purpose: Send win-back emails to canceled users (Day 7, 30, 90, 180)

11. **Trial Reminders**

    - Endpoint: `/api/cron/trial-reminders`
    - Schedule: Daily
    - Purpose: Send trial expiration reminders (Day 12, 14)

12. **Performance Timeline Aggregation**

    - Endpoint: `/api/cron/aggregate-performance-timeline`
    - Schedule: Daily
    - Purpose: Aggregate daily performance metrics for Premium users

13. **Cleanup Stale Actions**

    - Endpoint: `/api/cron/cleanup-stale-actions`
    - Schedule: Daily (2 AM UTC)
    - Purpose: Clean up stale actions

14. **Calendar Token Maintenance**
    - Endpoint: `/api/cron/calendar-token-maintenance`
    - Schedule: Daily (2 AM UTC)
    - Purpose: Proactively refresh calendar tokens expiring within 24 hours to prevent expiration for inactive users

### Environment Variables

- `CRON_SECRET`: Secret token for cron job authentication (stored in Doppler)
- `CRON_JOB_ORG_API_KEY`: API key for cron-job.org authentication (stored in Doppler)

### Configuration Notes

- All cron jobs support both Authorization header and query parameter authentication
- Secrets are trimmed and cleaned (remove newlines/whitespace) to prevent auth failures
- Debug logging is enabled in production to diagnose authentication issues
- Cron jobs use Supabase admin client (service role) for database access

---

## PRD Summary

### Problem Statement

Solopreneurs and fractional leaders struggle with:

- Inconsistent outreach and follow-up
- Stalled conversations and ghosted threads
- No clear answer to "What should I do today to move revenue?"
- Overbuilt CRMs that demand data entry
- Generic habit trackers not tied to pipeline

### Solution

A simple, trustworthy daily list of actions that:

- Respects calendar and capacity
- Focuses on follow-ups and high-leverage outreach
- Compounds into booked calls and deals

### Core Features (v0.1)

1. **Actions-First Daily Plan**

   - Short list of high-impact actions each morning
   - Automatically sized based on calendar availability
   - Includes one Fast Win to build momentum

2. **Leads Management**

   - Simple leads (name + URL)
   - No CRM complexity
   - Snooze/archive functionality

3. **Follow-Up System**

   - One-tap "Got a reply" handling
   - Smart defaults for snoozing
   - Automatic next steps

4. **Weekly Rhythm**

   - Automatic weekly summary
   - AI-assisted narrative
   - Simple insights
   - Content prompts based on real activity

5. **Calendar-Aware Capacity**

   - Connect Google/Outlook calendar
   - Daily plans adjust to availability
   - Fallback to fixed lightweight plan if no calendar

6. **Billing & Subscriptions**
   - Stripe-powered checkout
   - Standard ($29/mo) and Premium ($79/mo) tiers
   - 14-day free trial (no credit card)

### Success Criteria

- **48-Hour Activation**: ≥60% of new users add 1+ lead, complete Fast Win + 2 actions, mark 1 action as "Got reply"
- **Weekly Habit**: ≥50% of active users complete actions on ≥4 days/week by Week 2
- **Revenue Signal**: ≥40% of active users log ≥1 booked call within 14 days
- **Content Behavior**: ≥20% of active users publish ≥1 post/week based on prompts

---

## Completed Backlog Summary

### P0 – MVP Must-Haves ✅

**Foundation & Billing**

- ✅ Stripe API routes (checkout & portal)
- ✅ Stripe webhook + subscription sync
- ✅ Supabase Auth pages & profile bootstrap
- ✅ Paywall middleware & base overlay

**Leads & Actions**

- ✅ Lead management UI + API
- ✅ Action engine core

**Daily Plan**

- ✅ Plan generation service
- ✅ Daily Plan page UI
- ✅ Action priority ranking improvements
- ✅ Stale actions insight & algorithm v2

**Calendar Integration**

- ✅ Google & Outlook OAuth flows
- ✅ Free/busy API + status indicators
- ✅ Customizable working hours

**Weekly Summary & Content**

- ✅ Weekly summary metrics job
- ✅ Weekly Summary page
- ✅ Content prompt generation
- ✅ Copy to clipboard for content prompts

**Onboarding**

- ✅ Onboarding flow (8 steps)

**Settings & Export**

- ✅ Settings page framework
- ✅ Billing section UI
- ✅ Data export endpoint
- ✅ Email preferences & account deletion controls

**Background Jobs & Observability**

- ✅ Background jobs (all cron jobs via cron-job.org)
- ✅ Observability setup (GlitchTip, Umami, structured logging)

### P1 – High Value Enhancements ✅

- ✅ Account overview: Password change & timezone editing
- ✅ Password reset / Forgot password flow
- ✅ Notification preferences wiring
- ✅ Paywall analytics & copy polish
- ✅ Past-due & cancellation banners
- ✅ Adaptive recovery & celebration flows
- ✅ Content Ideas list page
- ✅ Trial expiration & read-only grace period
- ✅ Trial reminders
- ✅ Plan upgrade triggers
- ✅ Streak break detection & recovery
- ✅ Payment failure recovery flow
- ✅ Win-back campaign automation
- ✅ Premium plan features (Pattern detection, Pre-call briefs, Performance timeline, Content engine)
- ✅ Plan downgrade handling
- ✅ Display weekly focus on Daily Plan page

### Launch Hardening ✅

- ✅ Legal compliance (Privacy Policy, Terms of Service)
- ✅ Staging environment security (Basic Auth)
- ✅ Security fixes (JWT exposure, CSP hardening)
- ✅ Design linting setup (Lapidist)
- ✅ Production deployment
- ✅ Post-deployment verification

---

## Current Backlog

### P0 – MVP Must-Haves (Remaining)

**Foundation & Tooling**

- [ ] Project initialization & tooling (mostly complete, may need updates)
- [ ] Supabase schema & migrations (mostly complete, may need updates)

### P2 – Nice-to-Have / v0.2 Candidates

**Priority Order:**

1. **Company research & enrichment for pre-call briefs** 🔄 **NEXT P2 ITEM**

   - Automatically enrich pre-call briefs with company information, news, and SEC filings
   - Extract company domain from email/LinkedIn URL
   - Fetch company details (name, industry, size), recent news/press releases
   - SEC 10Q filings for public companies
   - Display in pre-call briefs to provide "junior analyst"-level prep
   - Gate behind Premium plan

2. **Design token compliance (incremental)** ⏱ **POST-LAUNCH**

   - Fix design token violations incrementally over 2-4 weeks
   - Replace hardcoded colors, spacing, and border radius values with design tokens
   - Add missing tokens (radius.none, success-green-dark, fast-win-accent-hover)
   - Fix ~498 violations across ActionCard, PriorityIndicator, settings pages, and onboarding flow
   - Estimated: 8-10 hours total, 2-3 hours/week

3. **Manual "Busy / Light day" capacity override**

   - Allow users to manually override capacity for a day

4. **Action detail modal / history view**

   - View detailed history of an action

5. **Additional login providers**

   - Apple, LinkedIn, etc.

6. **Deeper analytics**

   - Deal progression metric, more insights

7. **Notification delivery channels**

   - Email/push beyond toggles

8. **Pricing page UI**

   - Standard vs Premium comparison, annual savings, clear value props

9. **Billing pause feature**

   - 30-day pause for users inactive 7+ days

10. **Cancellation feedback analytics page**

    - Admin/internal page to view and analyze cancellation feedback

11. **Enhanced pre-call brief detection**

    - Recognize Zoom, Google Meet, Microsoft Teams meetings (not just "call")

12. **POST_CALL auto-generation**

    - Automatically create POST_CALL actions when calendar events (calls) end

13. **CALL_PREP auto-generation**

    - Automatically create CALL_PREP actions 24 hours before detected calls

14. **NURTURE auto-generation**

    - Automatically create NURTURE actions for leads that haven't been contacted in 21+ days

15. **CONTENT action conversion from weekly summaries**

    - Convert weekly summary content prompts to CONTENT actions

16. **Industry/work type selection & trend-based content generation**
    - Add industry selection, implement trend scraping, enhance content generation

### Launch Hardening (Remaining)

- [ ] Full QA + accessibility sweep
- [ ] Production Stripe smoke test (checkout → webhook → paywall release)
- [ ] Documentation cleanup & release checklist

---

## Key Architecture Decisions

1. **Cron Jobs**: Using cron-job.org (external service), NOT Vercel Cron
2. **Secrets Management**: Doppler is source of truth, synced to Vercel
3. **Database**: Supabase PostgreSQL with RLS for security
4. **Authentication**: Supabase Auth for users, OAuth only for calendar access
5. **Payments**: Stripe with webhook verification and idempotency
6. **Email**: Resend API with rate limiting protection
7. **Error Tracking**: GlitchTip (Sentry-compatible SDK)
8. **Analytics**: Umami (privacy-friendly, GDPR-compliant)

---

## Important Notes

- **Cron Jobs**: All scheduled jobs use cron-job.org, configured externally
- **Authentication**: Cron jobs authenticate via Authorization header or query parameter
- **Secrets**: Always trim and clean secrets to prevent auth failures
- **Environments**: Staging uses Doppler `stg` config, Production uses `prd` config
- **Deployment**: Staging → Production workflow via `deploy-production.sh` script

---

**For detailed implementation guides, see:**

- `docs/Architecture/Implementation_Guide.md`
- `docs/Architecture/Database_Schema.md`
- `docs/PRD/NextBestMove_PRD_v1.md`
- `docs/backlog.md`
