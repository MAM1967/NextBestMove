# Cursor Guide for NextBestMove

> **IMPORTANT:** Read this file at the start of every new chat session to understand the project context, architecture, and development standards.

This file provides guidance to Cursor when working with code in this repository.

## Project Status

**Ready for Launch** - Core features implemented, launch hardening completed. Target launch: January 13, 2026.

## Product Vision

**NextBestMove** is an actions-first workflow app that helps solopreneurs and fractional executives maintain a consistent revenue rhythm.

### Core Problem

Solopreneurs and fractional leaders struggle with:

- Inconsistent outreach and follow-up
- Stalled conversations and ghosted threads
- No clear answer to "What should I do today to move revenue?"
- Overbuilt CRMs that demand data entry
- Generic habit trackers not tied to pipeline

### Core Solution

A calendar-aware system that suggests "the next best move" based on:

- Available time windows (5, 10, 15+ minutes) from connected calendars
- Relationship context and conversation history
- Daily plans sized to real schedule (3-8 actions/day)
- Weekly summaries with AI-powered insights

### Key Differentiators

- NOT a CRM - positioned as "personal network management" to avoid CRM stigma
- Reduces cognitive load rather than adding administrative burden
- Calendar-first, relationship-centric workflow
- AI-powered action suggestions and context extraction
- Actions-first approach (not leads-first)

## Technical Architecture

### Tech Stack

**Frontend:**

- Next.js 16+ (App Router)
- React 19.2.3
- TypeScript
- Tailwind CSS 4+
- Design tokens system (`web/design.tokens.json`)

**Backend:**

- Next.js API Routes
- Node.js 24.x
- PostgreSQL (Supabase)

**Authentication:**

- Supabase Auth (`@supabase/ssr`, `@supabase/auth-helpers-nextjs`)

**Calendar Integration:**

- Google Calendar API (`googleapis`)
- Microsoft Graph API (`@microsoft/microsoft-graph-client`)
- Direct OAuth 2.0 implementation (no NextAuth.js)

**Payments:**

- Stripe Checkout + Billing Portal
- Stripe webhooks for subscription sync

**AI:**

- OpenAI GPT-4 (`openai`)

**Email:**

- Resend (`resend`)

**Observability:**

- GlitchTip (error tracking, Sentry-compatible)
- Umami (privacy-focused analytics)

**Hosting:**

- Vercel (frontend + API routes)
- Supabase (database + auth)

### Data Model

**Core Entities:**

- `users` - User accounts with timezone, streak tracking, working hours
- `leads` - Lightweight leads (name, url, notes, status: ACTIVE/SNOOZED/ARCHIVED)
- `actions` - Action items with state machine (NEW/SENT/REPLIED/SNOOZED/DONE/ARCHIVED)
- `daily_plans` - Generated daily plans with capacity tracking
- `daily_plan_actions` - Junction table for ordered actions in plans
- `weekly_summaries` - Weekly reports with AI insights
- `content_prompts` - Saved content prompts from weekly summaries
- `calendar_connections` - OAuth calendar connections (encrypted tokens)
- `billing_customers` - Stripe customer records
- `billing_subscriptions` - Stripe subscription records

**Action Types:**

- OUTREACH, FOLLOW_UP, NURTURE, CALL_PREP, POST_CALL, CONTENT, FAST_WIN

**Action States:**

- NEW → SENT/REPLIED/SNOOZED/ARCHIVED
- SENT → REPLIED/DONE/SNOOZED/ARCHIVED
- REPLIED → NEW (next action)/DONE
- SNOOZED → NEW (on snooze_until date)/ARCHIVED

See `docs/Architecture/Database_Schema.md` for complete schema.

### API Routes Structure

**User-Facing:**

- `/api/leads` - Lead CRUD operations
- `/api/actions` - Action state management
- `/api/daily-plans` - Daily plan generation and retrieval
- `/api/weekly-summaries` - Weekly summary generation and retrieval
- `/api/calendar/*` - Calendar connection, status, free/busy
- `/api/billing/*` - Stripe checkout, portal, webhooks
- `/api/users/*` - User preferences, settings, data export

**Background Jobs (Cron):**

- `/api/cron/daily-plans` - Daily plan generation (1 AM UTC)
- `/api/cron/weekly-summaries` - Weekly summary generation (Monday 1 AM UTC)
- `/api/cron/auto-archive` - Archive old actions (9 PM UTC)
- `/api/cron/auto-unsnooze` - Unsnooze actions/leads (2 AM UTC)
- `/api/cron/calendar-token-maintenance` - Refresh expiring tokens (2 AM UTC)
- `/api/cron/trial-reminders` - Trial expiration emails (8 AM UTC)
- `/api/cron/streak-recovery` - Streak break detection (3 AM UTC)
- `/api/cron/payment-failure-recovery` - Payment failure recovery (daily)
- `/api/cron/win-back-campaign` - Win-back emails (daily)

**Notifications:**

- `/api/notifications/morning-plan` - Morning plan emails (hourly)
- `/api/notifications/fast-win-reminder` - Fast win reminders (hourly)
- `/api/notifications/follow-up-alerts` - Follow-up alerts (10 AM UTC)

All cron endpoints support authentication via:

1. Query parameter: `?secret=CRON_SECRET`
2. Authorization header: `Bearer CRON_SECRET`
3. Authorization header: `Bearer CRON_JOB_ORG_API_KEY`

See `docs/Cron_Job_Configuration.md` for details.

## Environment & Deployment

### Environments

**Production:**

- Domain: `https://nextbestmove.app`
- Vercel Environment: Production
- Branch: `main`
- Supabase: Production project
- Stripe: Live mode
- CRON_SECRET: `99ad993f6bcf96c3523502f028184b248b30d125a0f2964c012afa338334b0da`

**Staging:**

- Domain: `https://staging.nextbestmove.app`
- Vercel Environment: Preview
- Branch: `staging`
- Supabase: Staging project (separate from production)
- Stripe: Test mode
- CRON_SECRET: `e6720e0c094fd8ba7494b27073d03c6405d9422bdc1e0af0a7e16f678f55ec83`

### Environment Variables

**Required (via Doppler):**

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
- `OUTLOOK_CLIENT_ID` / `OUTLOOK_CLIENT_SECRET` / `OUTLOOK_TENANT_ID` - Microsoft OAuth credentials
- `CALENDAR_ENCRYPTION_KEY` - 32-byte key for encrypting OAuth tokens
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `STRIPE_PRICE_ID_STANDARD_MONTHLY` / `STRIPE_PRICE_ID_STANDARD_YEARLY` - Stripe price IDs
- `STRIPE_PRICE_ID_PREMIUM_MONTHLY` / `STRIPE_PRICE_ID_PREMIUM_YEARLY` - Stripe price IDs
- `RESEND_API_KEY` - Resend email API key
- `OPENAI_API_KEY` - OpenAI API key
- `CRON_SECRET` - Secret for cron job authentication (separate for staging/production)
- `CRON_JOB_ORG_API_KEY` - cron-job.org API key
- `NEXT_PUBLIC_APP_URL` - App URL (for email links)
- `NEXT_PUBLIC_GLITCHTIP_DSN` - GlitchTip error tracking DSN
- `NEXT_PUBLIC_UMAMI_URL` / `NEXT_PUBLIC_UMAMI_WEBSITE_ID` - Umami analytics

**Environment Variable Management:**

- Primary source: Doppler (separate configs for staging/production)
- Sync scripts: `scripts/sync-doppler-to-vercel.sh` (production), `scripts/sync-doppler-to-vercel-preview.sh` (staging)
- Never commit `.env.local` to git

### Deployment Scripts

**⚠️ IMPORTANT: Always use the deployment scripts, never push directly with `git push`**

The deployment scripts run critical checks (TypeScript, design lint) and sync environment variables before pushing. Direct git pushes bypass these safety checks.

**Staging Deployment:**

```bash
./scripts/deploy-staging.sh [optional commit message]
```

**Workflow (6 steps):**

1. **TypeScript Type Check** - Runs `npm run type-check` in `web/` directory

   - **Blocks deployment if errors found** - Must fix TypeScript errors before proceeding
   - Ensures type safety before code reaches staging

2. **Design Lint** - Runs `npm run lint:design` (Lapidist)

   - **Warnings only** - Does not block deployment
   - Checks for design token violations (hardcoded colors, spacing, etc.)

3. **Doppler Sync** - Syncs environment variables from Doppler to Vercel Preview

   - Uses `scripts/sync-doppler-to-vercel-preview.sh`
   - Syncs all secrets from Doppler `stg` config to Vercel Preview environment
   - **Blocks deployment if sync fails**

4. **Capture Current Branch** - **CRITICAL STEP** - Captures current branch and commits before switching

   - Commits any uncommitted changes on current branch first
   - Remembers current branch name for later merge
   - **Prevents "no differences" PR issue**

5. **Create Deployment Branch** - Creates feature branch from staging and merges current branch

   - Switches to `staging` branch and pulls latest
   - Creates new `deploy/staging-{timestamp}` branch
   - **Merges current branch's commits into deployment branch** (if different from staging)
   - Ensures deployment branch has both latest staging AND our changes

6. **Git Push** - Pushes deployment branch to origin
   - Provides PR link for review
   - After PR merge, Vercel automatically deploys from staging branch
   - Deploys to `https://staging.nextbestmove.app`

**Example:**

```bash
./scripts/deploy-staging.sh "NEX-10: Fix TypeScript errors and deploy decision engine"
```

**Production Deployment:**

```bash
./scripts/deploy-production.sh [optional commit message]
```

**Workflow (6 steps with safety confirmation):**

1. **Safety Confirmation** - Requires typing "yes" to proceed

   - **WARNING prompt** - Reminds you this is production
   - Prevents accidental production deployments

2. **TypeScript Type Check** - Same as staging

   - **Blocks deployment if errors found**

3. **Design Lint** - Same as staging (warnings only)

4. **Doppler Sync** - Syncs environment variables from Doppler to Vercel Production

   - Uses `scripts/sync-doppler-to-vercel.sh`
   - Syncs all secrets from Doppler `prd` config to Vercel Production environment
   - **Blocks deployment if sync fails**

5. **Capture Current Branch** - **CRITICAL STEP** - Captures current branch and commits before switching

   - Commits any uncommitted changes on current branch first
   - Remembers current branch name for later merge
   - **Prevents "no differences" PR issue**

6. **Create Deployment Branch** - Creates feature branch from main and merges current branch

   - Switches to `main` branch and pulls latest
   - Creates new `deploy/production-{timestamp}` branch
   - **Merges current branch's commits into deployment branch** (if different from main)
   - Ensures deployment branch has both latest main AND our changes

7. **Git Push** - Pushes deployment branch to origin
   - Provides PR link for review
   - After PR merge, Vercel automatically deploys from main branch
   - Deploys to `https://nextbestmove.app`

**Example:**

```bash
./scripts/deploy-production.sh "NEX-10: Deploy decision engine to production"
```

**Best Practices:**

- ✅ **Always test in staging first** - Never deploy to production without staging verification
- ✅ **Use descriptive commit messages** - Include Linear issue IDs (e.g., "NEX-10: ...")
- ✅ **Check TypeScript errors locally** - Run `npm run type-check` in `web/` before deploying
- ✅ **Verify Doppler sync** - Check that environment variables are correctly synced
- ✅ **Monitor Vercel dashboard** - Watch for build/deployment errors after push
- ✅ **Verify PR shows differences** - If PR shows "no differences", the deployment script didn't merge your branch correctly
- ❌ **Never push directly** - Always use the deployment scripts
- ❌ **Never skip type checks** - Fix TypeScript errors before deploying

**⚠️ Critical Fix (2026-01-02):** The deployment scripts now include a critical step that merges your current branch's commits into the deployment branch. This prevents the "no differences" PR issue. See `docs/Development/Deployment_Script_Fix.md` for details.

**Database Migrations:**

- Location: `supabase/migrations/`
- Apply to staging: `scripts/push-migrations-to-staging.sh`
- Apply to production: Manual via Supabase dashboard or `scripts/apply-production-migration.sql`

### Cron Jobs

**Managed via cron-job.org:**

- All jobs configured via cron-job.org API
- Scripts: `scripts/create-calendar-token-maintenance-cron.sh`, `scripts/create-staging-cron-jobs.sh`
- Documentation: `docs/Cron_Job_Configuration.md`

**Job Schedule:**

- Daily Plans: 1:00 AM UTC
- Weekly Summaries: Monday 1:00 AM UTC
- Auto-Archive: 9:00 PM UTC
- Auto-Unsnooze: 2:00 AM UTC
- Calendar Token Maintenance: 2:00 AM UTC
- Trial Reminders: 8:00 AM UTC
- Streak Recovery: 3:00 AM UTC
- Morning Plan Emails: Hourly
- Fast Win Reminders: Hourly
- Follow-Up Alerts: 10:00 AM UTC

## File Structure

### Key Directories

```
NextBestMove/
├── web/                          # Next.js application
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   │   ├── app/            # Authenticated app pages
│   │   │   │   ├── plan/       # Daily Plan page
│   │   │   │   ├── actions/    # Actions page
│   │   │   │   ├── relationships/ # Leads/Relationships page
│   │   │   │   ├── weekly-review/ # Weekly Review page
│   │   │   │   ├── settings/   # Settings page
│   │   │   │   └── ...
│   │   │   └── api/            # API routes
│   │   ├── components/         # React components
│   │   └── lib/                # Utilities & services
│   │       ├── calendar/       # Calendar integration
│   │       ├── billing/        # Stripe integration
│   │       ├── ai/             # OpenAI integration
│   │       ├── email/          # Resend integration
│   │       └── supabase/        # Supabase client/server
│   ├── design.tokens.json      # Design token system
│   └── package.json
├── supabase/
│   └── migrations/            # Database migrations
├── scripts/                     # Deployment & utility scripts
│   ├── deploy-staging.sh       # Staging deployment
│   ├── deploy-production.sh    # Production deployment
│   ├── sync-doppler-to-vercel.sh # Environment variable sync
│   └── ...
├── docs/                        # Documentation
│   ├── PRD/                    # Product requirements
│   ├── Architecture/           # Technical specs
│   ├── Planning/               # User stories & planning
│   ├── Testing/                # Test plans
│   └── Troubleshooting/        # Troubleshooting guides
└── README.md
```

### Important Files

**Configuration:**

- `web/package.json` - Dependencies and scripts
- `web/design.tokens.json` - Design token system
- `web/tsconfig.json` - TypeScript configuration
- `web/next.config.ts` - Next.js configuration
- `supabase/config.toml` - Supabase configuration

**Documentation:**

- `docs/PRD/NextBestMove_PRD_v1.md` - Complete product requirements
- `docs/backlog.md` - Current backlog with priorities
- `docs/Architecture/Database_Schema.md` - Database schema
- `docs/Cron_Job_Configuration.md` - Cron job setup
- `QUICK_START.md` - Quick start guide

**Scripts:**

- `scripts/deploy-staging.sh` - Staging deployment workflow
- `scripts/deploy-production.sh` - Production deployment workflow
- `scripts/sync-doppler-to-vercel.sh` - Environment variable sync

## Development Standards

### Code Style

- TypeScript strict mode enabled
- ESLint configured (Next.js config)
- Design lint (`@lapidist/design-lint`) for design token compliance
- Prettier (via ESLint)

### Best Practices

**File Modification:**

- **ALWAYS read files first** - Check the current state of a file before modifying it
- Never assume file contents - Read the file to understand its current structure and content
- This prevents errors from mismatched search/replace operations and ensures changes align with existing code

**Error Handling:**

- Graceful degradation (never block users)
- Log errors with full context
- Show human-friendly messages
- Calendar errors → fallback to default capacity

**Security:**

- Row Level Security (RLS) on all Supabase tables
- OAuth tokens encrypted at rest
- CRON_SECRET authentication for all cron endpoints
- Stripe webhook signature verification

**Performance:**

- Daily plan generation: < 500ms
- Action state change: < 100ms
- Weekly summary generation: < 2s
- Calendar free/busy: Cached with fallback

**Database:**

- All migrations in `supabase/migrations/`
- Use Supabase migrations (not manual SQL)
- Test migrations on staging first
- Backfill scripts in `scripts/` when needed

## Key Features & Workflows

### Daily Plan Generation

1. Calculate capacity from calendar free/busy (or default 5-6)
2. Select Fast Win (highest priority, <5 min action)
3. Fill remaining slots by priority score
4. Store in `daily_plans` and `daily_plan_actions` tables

**Priority Order:**

1. Next-step actions after REPLIED
2. FOLLOW_UP with due date today
3. FOLLOW_UP with due date in past 3 days
4. OUTREACH on recent Active Leads
5. NURTURE tasks
6. CONTENT tasks

### Weekly Summary Generation

1. Aggregate metrics (actions completed, replies, calls booked)
2. Generate narrative (2-3 sentences, AI-assisted)
3. Generate insight (e.g., "Follow-ups within 3 days convert better")
4. Suggest next week's focus
5. Generate content prompts (if ≥6 actions completed)

### Calendar Integration

**OAuth Flow:**

1. User clicks "Connect Calendar"
2. Redirect to Google/Microsoft OAuth
3. Store encrypted refresh token in `calendar_connections`
4. Update `users.calendar_connected` flag

**Token Refresh:**

- Background job refreshes tokens expiring within 24 hours
- Automatic refresh on API calls if expired
- Mark connection as expired if refresh fails

**Free/Busy:**

- Cached for performance
- Fallback to default capacity if unavailable
- Respects working hours and weekend preferences

### Billing & Subscriptions

**Plans:**

- Standard: $29/mo or $249/year (10 active leads max)
- Premium: $79/mo or $649/year (unlimited leads + premium features)

**Trial:**

- 14-day free trial (no credit card)
- Full access during trial
- 7-day read-only grace period after trial

**Subscription States:**

- TRIALING - Active trial
- ACTIVE - Paid subscription
- PAST_DUE - Payment failed
- CANCELED - User canceled

**Webhooks:**

- `checkout.session.completed` - Create subscription
- `customer.subscription.updated` - Update subscription status
- `invoice.paid` - Handle payment success
- `invoice.payment_failed` - Trigger recovery flow

## External Services & URLs

### Vercel

- Production: `https://vercel.com/dashboard` (project: next-best-move)
- Staging: Preview environment (auto-deploys from `staging` branch)

### Supabase

- Production: Separate project (configured in Vercel env vars)
- Staging: Separate project (configured in Vercel env vars)
- Dashboard: `https://supabase.com/dashboard`

### Stripe

- Dashboard: `https://dashboard.stripe.com`
- Test mode: Separate from live mode
- Webhooks: Configured in Stripe dashboard

### Doppler

- Environment variable management
- Separate configs for staging/production
- Sync scripts: `scripts/sync-doppler-to-vercel*.sh`

### cron-job.org

- Cron job scheduling service
- API key: `CRON_JOB_ORG_API_KEY`
- Dashboard: `https://cron-job.org/en/members/jobs/`

### GlitchTip

- Error tracking (Sentry-compatible)
- DSN: `NEXT_PUBLIC_GLITCHTIP_DSN`

### Umami

- Privacy-focused analytics
- URL: `NEXT_PUBLIC_UMAMI_URL`
- Website ID: `NEXT_PUBLIC_UMAMI_WEBSITE_ID`

## Testing

**Test Files:**

- `web/tests/critical-paths/` - Playwright E2E tests
- `docs/Testing/` - Test plans and guides

**Test Commands:**

- `npm run test:staging` - Run E2E tests
- `npm run test:staging:ui` - Run with UI
- `npm run test:staging:debug` - Debug mode

## Troubleshooting

**Common Issues:**

- See `docs/Troubleshooting/` for guides
- Calendar OAuth: `docs/Troubleshooting/Fix_Google_OAuth_Redirect_URI_Mismatch.md`
- Cron jobs: `docs/Troubleshooting/Fix_Cron_Jobs_Manually.md`
- Environment variables: `docs/Vercel_Environment_Variables_Troubleshooting.md`

## Reference Materials

### Product Context

- **PRD:** `docs/PRD/NextBestMove_PRD_v1.md`
- **Backlog:** `docs/backlog.md`
- **UI Specifications:** `docs/UI-UX/UI_Specifications.md`

### Technical Documentation

- **Database Schema:** `docs/Architecture/Database_Schema.md`
- **Calendar Integration:** `docs/Architecture/Calendar_API_Specifications.md`
- **API Documentation:** `docs/Architecture/API_Documentation.md`
- **Component Specs:** `docs/Architecture/Component_Specifications.md`

### Deployment & Operations

- **Cron Jobs:** `docs/Cron_Job_Configuration.md`
- **Staging Setup:** `docs/Architecture/Staging_Environment_Setup_Guide.md`
- **Observability:** `docs/Observability.md`

## Workflow Instructions

When asked to work on this codebase:

1. **First**, check `docs/backlog.md` for current priorities
2. **Review** relevant documentation in `docs/` directory
3. **Follow** deployment scripts for staging/production
4. **Test** on staging before production
5. **Always** run type-check before deploying
6. **Update** `docs/backlog.md` when completing tasks

## Important Notes

- **Never commit `.env.local`** - All secrets via Doppler
- **Test on staging first** - Staging is isolated from production
- **Database migrations** - Always test on staging before production
- **Cron jobs** - Separate secrets for staging/production
- **OAuth redirect URIs** - Must match exactly (no trailing slashes)
- **Design tokens** - Use design token system, not hardcoded values
- **Error handling** - Always fail gracefully, never block users

---

**Last Updated:** December 2025  
**Project Status:** Ready for launch, launch target January 13, 2026
