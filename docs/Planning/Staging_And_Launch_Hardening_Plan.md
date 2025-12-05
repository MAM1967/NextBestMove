# Staging Environment & Launch Hardening Implementation Plan

**Status:** 📋 Ready for Implementation  
**Priority:** P1 (Final P1 items before launch)  
**Estimated Time:** 3-4 days total

- Staging Environment Setup: 1-2 days
- Launch Hardening: 1-2 days

---

## Overview

This plan covers two critical pre-launch activities:

1. **Staging Environment Setup** - Create isolated staging environment for safe testing
2. **Launch Hardening** - Final QA, testing, and documentation before production launch

**Reference Documents:**

- `docs/Architecture/Staging_Environment_Setup_Guide.md` - Detailed staging setup guide
- `docs/backlog.md` - Launch hardening checklist

---

## Part 1: Staging Environment Setup

### Phase 1.1: GitHub Branch Workflow (30 minutes)

**Goal:** Set up branch protection and workflow for staging

**Tasks:**

1. [ ] Create `staging` branch from `main`

   ```bash
   git checkout -b staging
   git push -u origin staging
   ```

2. [ ] Configure branch protection rules in GitHub:

   - **Production (`main`):**

     - ✅ Require pull request reviews
     - ✅ Require status checks to pass (lint, type-check)
     - ✅ Require branches to be up to date before merging
     - ✅ No direct pushes

   - **Staging (`staging`):**
     - ✅ Require pull request reviews (self-approval OK for solo dev)
     - ✅ Require status checks to pass
     - ✅ Allow force pushes (for emergency fixes)

3. [ ] Update `.github/workflows/` if CI/CD exists
   - Ensure workflows run on both `main` and `staging` branches

**Acceptance Criteria:**

- [ ] `staging` branch exists and is protected
- [ ] Branch protection rules configured
- [ ] Workflow: `feature/*` → `staging` → `main` is clear

---

### Phase 1.2: Supabase Staging Project (1-2 hours)

**Goal:** Create separate Supabase project for staging

**Tasks:**

1. [ ] Create new Supabase project:

   - **Name:** `nextbestmove-staging`
   - **Region:** Same as production (for consistency)
   - **Database:** `nextbestmove_staging`

2. [ ] Copy production schema to staging:

   ```bash
   # Export production schema (if needed)
   supabase db dump --project-ref <prod-id> > staging-schema.sql

   # Apply all migrations to staging
   supabase db push --project-ref <staging-id>
   ```

3. [ ] Configure staging auth settings:

   - [ ] Disable email confirmations (or use test domains)
   - [ ] Turn off OAuth providers (unless testing OAuth)
   - [ ] Set redirect URLs: `https://staging.nextbestmove.app/auth/callback`
   - [ ] Disable "invite users" functionality

4. [ ] Create test users in staging:

   - [ ] Premium test user: `test+premium@example.com`
   - [ ] Standard test user: `test+standard@example.com`
   - [ ] Test users with various states (trial, active, canceled)

5. [ ] Verify RLS policies work correctly:
   - [ ] Test with multiple test users
   - [ ] Verify data isolation

**Acceptance Criteria:**

- [ ] Staging Supabase project created
- [ ] All migrations applied successfully
- [ ] Test users created
- [ ] RLS policies tested and working
- [ ] Staging project URL and keys documented

**Environment Variables to Document:**

- `NEXT_PUBLIC_SUPABASE_URL` (staging)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (staging)
- `SUPABASE_SERVICE_ROLE_KEY` (staging)

---

### Phase 1.3: Vercel Staging Configuration (1 hour)

**Goal:** Configure Vercel for staging branch deployment

**Tasks:**

1. [ ] Configure staging domain in Vercel:

   - [ ] Go to Project → Settings → Domains
   - [ ] Add domain: `staging.nextbestmove.app`
   - [ ] Assign `staging` branch to staging domain
   - [ ] Verify DNS: Add CNAME record for `staging.nextbestmove.app`

2. [ ] Set up environment variables for staging:

   - [ ] Go to Project → Settings → Environment Variables
   - [ ] Add all staging environment variables (see checklist below)
   - [ ] Ensure variables are scoped to `staging` branch only

3. [ ] Configure staging deployment settings:

   - [ ] Enable automatic deployments for `staging` branch
   - [ ] Set build command (if custom)
   - [ ] Set install command (if custom)

4. [ ] Test staging deployment:
   - [ ] Push a test commit to `staging` branch
   - [ ] Verify Vercel deploys to `staging.nextbestmove.app`
   - [ ] Verify environment variables are loaded correctly

**Staging Environment Variables Checklist:**

- [ ] `NEXT_PUBLIC_SUPABASE_URL` (staging project)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (staging anon key)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (staging service role key)
- [ ] `STRIPE_SECRET_KEY` (test mode: `sk_test_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` (staging webhook secret)
- [ ] `STRIPE_PRICE_ID_STANDARD_MONTHLY` (test price ID)
- [ ] `STRIPE_PRICE_ID_STANDARD_YEARLY` (test price ID)
- [ ] `STRIPE_PRICE_ID_PREMIUM_MONTHLY` (test price ID)
- [ ] `STRIPE_PRICE_ID_PREMIUM_YEARLY` (test price ID)
- [ ] `RESEND_API_KEY` (staging/test key)
- [ ] `CRON_SECRET` (staging cron secret)
- [ ] `CRON_JOB_ORG_API_KEY` (if using cron-job.org)
- [ ] `NEXT_PUBLIC_APP_URL` (`https://staging.nextbestmove.app`)
- [ ] `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (staging website ID)
- [ ] `SENTRY_DSN` or `GLITCHTIP_DSN` (staging project)
- [ ] `OPENAI_API_KEY` (can use same as prod, or separate test key)
- [ ] `STAGING_USER` (for password protection, if using)
- [ ] `STAGING_PASS` (for password protection, if using)

**Acceptance Criteria:**

- [ ] Staging domain configured in Vercel
- [ ] DNS CNAME record added
- [ ] All environment variables set for staging
- [ ] Test deployment successful
- [ ] Staging site accessible at `staging.nextbestmove.app`

---

### Phase 1.4: Staging Security (30 minutes)

**Goal:** Secure staging environment from public access

**Status:** ✅ Implementation Complete - Ready for Configuration

**Tasks:**

1. [x] Choose protection method:

   - **Option A:** Vercel Pro Password Protection (if available)
   - **Option B:** Next.js middleware with Basic Auth ✅ **SELECTED**
   - **Option C:** IP restrictions (if team has static IPs)

2. [x] Implement protection (if using middleware):

   - [x] Create/update `middleware.ts` with Basic Auth ✅
   - [ ] Add `STAGING_USER` and `STAGING_PASS` env vars (TODO: Add to Vercel)
   - [ ] Test password protection works (TODO: After env vars added)

3. [ ] Verify protection:
   - [ ] Access staging site without credentials → should prompt for password
   - [ ] Access with correct credentials → should load site
   - [ ] Test API routes (should not be protected)

**Acceptance Criteria:**

- [x] Basic Auth middleware implemented
- [ ] `STAGING_USER` and `STAGING_PASS` added to Vercel (Preview scope)
- [ ] Staging site requires authentication
- [ ] Team members can access with credentials
- [ ] Public access is blocked
- [ ] API routes remain accessible (for webhooks, cron jobs)

**Documentation:** See `docs/Planning/Phase_1.4_Staging_Security_Guide.md`

---

### Phase 1.5: Stripe Test Mode Setup (30 minutes)

**Goal:** Configure Stripe test mode for staging

**Tasks:**

1. [ ] Switch to Stripe Test Mode in dashboard

2. [ ] Create test products and prices:

   - [ ] Standard Plan (Monthly): $29.00 → Copy test price ID
   - [ ] Standard Plan (Yearly): $249.00 → Copy test price ID
   - [ ] Premium Plan (Monthly): $79.00 → Copy test price ID
   - [ ] Premium Plan (Yearly): $649.00 → Copy test price ID

3. [ ] Create staging webhook endpoint:

   - [ ] URL: `https://staging.nextbestmove.app/api/billing/webhook`
   - [ ] Events: All billing events (`customer.subscription.*`, `invoice.*`, etc.)
   - [ ] Copy webhook signing secret

4. [ ] Update staging environment variables:

   - [ ] `STRIPE_SECRET_KEY` = test secret key (`sk_test_...`)
   - [ ] `STRIPE_WEBHOOK_SECRET` = staging webhook secret
   - [ ] All price IDs = test price IDs

5. [ ] Test Stripe integration:
   - [ ] Create test checkout session
   - [ ] Complete test payment with test card: `4242 4242 4242 4242`
   - [ ] Verify webhook receives events
   - [ ] Verify subscription created in staging database

**Acceptance Criteria:**

- [ ] Test products and prices created
- [ ] Staging webhook endpoint configured
- [ ] Test payment flow works end-to-end
- [ ] Webhooks process correctly in staging
- [ ] No real payments possible in staging

---

### Phase 1.6: Email Service Configuration (15 minutes)

**Goal:** Configure Resend for staging

**Tasks:**

1. [ ] Set up staging email configuration:

   - [ ] Use separate Resend API key (or test mode)
   - [ ] Configure staging domain (if separate)
   - [ ] Add `[STAGING]` prefix to email subjects in code

2. [ ] Test email sending:
   - [ ] Send test email from staging
   - [ ] Verify email received
   - [ ] Verify `[STAGING]` prefix appears

**Acceptance Criteria:**

- [ ] Staging emails configured
- [ ] Test emails send successfully
- [ ] Staging prefix visible in test emails

---

### Phase 1.7: Cron Jobs Configuration (30 minutes)

**Goal:** Set up cron jobs for staging

**Tasks:**

1. [ ] Configure cron jobs in `vercel.json` (if using Vercel Cron):

   - [ ] Daily plans generation
   - [ ] Weekly summaries
   - [ ] Payment failure recovery
   - [ ] Streak recovery
   - [ ] Win-back campaign
   - [ ] Performance timeline aggregation

2. [ ] Set up cron-job.org jobs (if using external service):

   - [ ] Create separate cron jobs for staging
   - [ ] Use staging URLs and `CRON_SECRET`
   - [ ] Test each cron endpoint manually

3. [ ] Test cron jobs:
   - [ ] Manually trigger each cron endpoint
   - [ ] Verify jobs process staging data only
   - [ ] Verify no production data affected

**Acceptance Criteria:**

- [ ] All cron jobs configured for staging
- [ ] Cron jobs use staging `CRON_SECRET`
- [ ] Manual testing successful
- [ ] Jobs process staging data only

---

### Phase 1.8: Monitoring & Observability (30 minutes)

**Goal:** Set up separate monitoring for staging

**Tasks:**

1. [ ] Set up Sentry/GlitchTip staging project:

   - [ ] Create separate project: `nextbestmove-staging`
   - [ ] Copy staging DSN to environment variables
   - [ ] Tag errors with `environment: staging`

2. [ ] Set up Umami staging website:

   - [ ] Create separate website ID for staging
   - [ ] Update `NEXT_PUBLIC_UMAMI_WEBSITE_ID` for staging
   - [ ] Verify analytics tracking works

3. [ ] Test error tracking:
   - [ ] Trigger a test error on staging
   - [ ] Verify error appears in staging Sentry/GlitchTip
   - [ ] Verify error tagged with `environment: staging`

**Acceptance Criteria:**

- [ ] Staging monitoring projects created
- [ ] Environment variables set
- [ ] Error tracking tested and working
- [ ] Analytics tracking tested and working

---

### Phase 1.9: Staging Testing Checklist (1-2 hours)

**Goal:** Comprehensive testing of staging environment

**Tasks:**

1. [ ] **Authentication & Onboarding:**

   - [ ] Sign up flow works
   - [ ] Sign in flow works
   - [ ] Email verification (if enabled)
   - [ ] Onboarding flow completes

2. [ ] **Core Features:**

   - [ ] Pin management (create, edit, delete, archive)
   - [ ] Daily plan generation
   - [ ] Action completion flows
   - [ ] Weekly summary generation

3. [ ] **Billing & Subscriptions:**

   - [ ] Stripe checkout (test mode)
   - [ ] Subscription creation
   - [ ] Webhook processing
   - [ ] Customer portal access
   - [ ] Plan upgrades/downgrades

4. [ ] **Premium Features:**

   - [ ] Pattern detection access
   - [ ] Pre-call briefs
   - [ ] Performance timeline
   - [ ] Voice learning

5. [ ] **Background Jobs:**

   - [ ] Daily plan cron job
   - [ ] Weekly summary cron job
   - [ ] Payment failure recovery
   - [ ] Streak recovery
   - [ ] Performance timeline aggregation

6. [ ] **Email Notifications:**

   - [ ] Morning plan email
   - [ ] Fast win reminder
   - [ ] Follow-up alerts
   - [ ] Weekly summary email

7. [ ] **Security:**
   - [ ] Password protection works
   - [ ] No production data accessible
   - [ ] RLS policies enforced
   - [ ] API routes secured

**Acceptance Criteria:**

- [ ] All core features work on staging
- [ ] No production data accessed
- [ ] All tests pass
- [ ] Staging environment is production-ready for testing

---

## Part 2: Launch Hardening

### Phase 2.1: Full QA Sweep (4-6 hours)

**Goal:** Comprehensive quality assurance testing

**Tasks:**

1. [ ] **Functional Testing:**

   - [ ] Test all user flows end-to-end
   - [ ] Test all Premium features
   - [ ] Test all Standard features
   - [ ] Test error handling and edge cases
   - [ ] Test payment flows (test mode)
   - [ ] Test subscription management

2. [ ] **Cross-Browser Testing:**

   - [ ] Chrome (latest)
   - [ ] Firefox (latest)
   - [ ] Safari (latest)
   - [ ] Edge (latest)
   - [ ] Mobile Safari (iOS)
   - [ ] Chrome Mobile (Android)

3. [ ] **Responsive Design Testing:**

   - [ ] Desktop (1920x1080, 1440x900)
   - [ ] Tablet (iPad, iPad Pro)
   - [ ] Mobile (iPhone, Android phones)
   - [ ] Verify all UI elements are accessible
   - [ ] Verify forms work on mobile

4. [ ] **Performance Testing:**

   - [ ] Page load times (< 3 seconds)
   - [ ] API response times (< 500ms)
   - [ ] Database query performance
   - [ ] Image optimization
   - [ ] Bundle size analysis

5. [ ] **Security Testing:**
   - [ ] SQL injection prevention
   - [ ] XSS prevention
   - [ ] CSRF protection
   - [ ] Authentication/authorization
   - [ ] API route security
   - [ ] Environment variable security

**Acceptance Criteria:**

- [ ] All critical user flows work
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Security vulnerabilities addressed

---

### Phase 2.2: Accessibility Audit (2-3 hours)

**Goal:** Ensure application is accessible to all users

**Tasks:**

1. [ ] **WCAG 2.1 AA Compliance:**

   - [ ] Color contrast ratios (4.5:1 for text)
   - [ ] Keyboard navigation
   - [ ] Screen reader compatibility
   - [ ] Focus indicators
   - [ ] Alt text for images
   - [ ] Form labels and error messages

2. [ ] **Testing Tools:**

   - [ ] Use axe DevTools or WAVE
   - [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
   - [ ] Test keyboard-only navigation
   - [ ] Test with browser zoom (200%)

3. [ ] **Common Issues to Fix:**
   - [ ] Missing ARIA labels
   - [ ] Insufficient color contrast
   - [ ] Missing focus states
   - [ ] Unclear error messages
   - [ ] Missing skip links
   - [ ] Non-semantic HTML

**Acceptance Criteria:**

- [ ] WCAG 2.1 AA compliance achieved
- [ ] All accessibility issues fixed
- [ ] Screen reader testing passed
- [ ] Keyboard navigation works

---

### Phase 2.3: Production Stripe Smoke Test (1-2 hours)

**Goal:** Verify Stripe integration works in production mode

**Tasks:**

1. [ ] **Pre-Production Setup:**

   - [ ] Switch Stripe to Live Mode
   - [ ] Verify live API keys are in production env vars
   - [ ] Verify live price IDs are correct
   - [ ] Verify production webhook endpoint configured

2. [ ] **Test Checkout Flow:**

   - [ ] Create checkout session (Standard Monthly)
   - [ ] Complete payment with real test card
   - [ ] Verify subscription created in database
   - [ ] Verify webhook received and processed
   - [ ] Verify user has access to features

3. [ ] **Test Subscription Management:**

   - [ ] Access customer portal
   - [ ] Test plan upgrade (Standard → Premium)
   - [ ] Test plan downgrade (Premium → Standard)
   - [ ] Test cancellation
   - [ ] Verify webhooks process correctly

4. [ ] **Test Payment Failure Handling:**

   - [ ] Use declined test card: `4000 0000 0000 0002`
   - [ ] Verify payment failure email sent
   - [ ] Verify recovery flow works

5. [ ] **Verify Webhook Security:**
   - [ ] Test webhook signature verification
   - [ ] Test invalid signature rejection
   - [ ] Verify idempotency handling

**Acceptance Criteria:**

- [ ] Checkout flow works end-to-end
- [ ] Webhooks process correctly
- [ ] Subscription management works
- [ ] Payment failures handled gracefully
- [ ] Webhook security verified

**⚠️ Important:** Use real Stripe test cards, not production cards, even in production mode testing.

---

### Phase 2.4: Documentation Cleanup (2-3 hours)

**Goal:** Ensure all documentation is up-to-date and accurate

**Tasks:**

1. [ ] **README Updates:**

   - [ ] Update installation instructions
   - [ ] Update environment variable list
   - [ ] Update deployment instructions
   - [ ] Add staging environment info
   - [ ] Add troubleshooting section

2. [ ] **API Documentation:**

   - [ ] Document all API endpoints
   - [ ] Document request/response formats
   - [ ] Document authentication requirements
   - [ ] Document error codes

3. [ ] **Architecture Documentation:**

   - [ ] Update database schema docs
   - [ ] Update deployment architecture
   - [ ] Update environment setup guides
   - [ ] Update security documentation

4. [ ] **User Documentation:**

   - [ ] Create user guide (if needed)
   - [ ] Update feature documentation
   - [ ] Create FAQ
   - [ ] Create troubleshooting guide

5. [ ] **Internal Documentation:**
   - [ ] Update development setup guide
   - [ ] Update testing guides
   - [ ] Update deployment procedures
   - [ ] Update rollback procedures

**Acceptance Criteria:**

- [ ] All documentation updated
- [ ] No outdated information
- [ ] Clear instructions for common tasks
- [ ] Troubleshooting guides complete

---

### Phase 2.5: Release Checklist (1 hour)

**Goal:** Create and complete final release checklist

**Tasks:**

1. [ ] **Pre-Launch Checklist:**

   - [ ] All P1 features complete
   - [ ] All tests passing
   - [ ] Staging environment tested
   - [ ] Production environment configured
   - [ ] Monitoring set up
   - [ ] Error tracking configured
   - [ ] Analytics configured

2. [ ] **Security Checklist:**

   - [ ] All secrets in environment variables
   - [ ] No secrets in code
   - [ ] RLS policies tested
   - [ ] API routes secured
   - [ ] CORS configured correctly
   - [ ] Rate limiting in place

3. [ ] **Performance Checklist:**

   - [ ] Database indexes optimized
   - [ ] API response times acceptable
   - [ ] Page load times acceptable
   - [ ] Images optimized
   - [ ] Bundle size optimized

4. [ ] **Legal/Compliance Checklist:**

   - [ ] Privacy policy published
   - [ ] Terms of service published
   - [ ] Cookie policy (if needed)
   - [ ] GDPR compliance (if applicable)
   - [ ] Email unsubscribe working

5. [ ] **Monitoring Checklist:**

   - [ ] Error tracking active
   - [ ] Analytics tracking active
   - [ ] Uptime monitoring configured
   - [ ] Alerting configured
   - [ ] Log aggregation set up

6. [ ] **Rollback Plan:**
   - [ ] Rollback procedure documented
   - [ ] Database rollback procedure
   - [ ] Vercel rollback procedure
   - [ ] Environment variable rollback procedure

**Acceptance Criteria:**

- [ ] All checklist items completed
- [ ] Rollback plan documented
- [ ] Team ready for launch

---

## Implementation Order

### Week 1: Staging Environment Setup

- **Day 1:** Phases 1.1-1.4 (GitHub, Supabase, Vercel, Security)
- **Day 2:** Phases 1.5-1.8 (Stripe, Email, Cron, Monitoring)
- **Day 3:** Phase 1.9 (Staging Testing)

### Week 2: Launch Hardening

- **Day 1:** Phase 2.1 (Full QA Sweep)
- **Day 2:** Phase 2.2 (Accessibility Audit) + Phase 2.3 (Stripe Smoke Test)
- **Day 3:** Phase 2.4 (Documentation) + Phase 2.5 (Release Checklist)

---

## Success Criteria

### Staging Environment

- ✅ Staging site accessible at `staging.nextbestmove.app`
- ✅ All features work on staging
- ✅ No production data accessible from staging
- ✅ Test payments work in Stripe test mode
- ✅ All cron jobs run correctly
- ✅ Monitoring and error tracking active

### Launch Hardening

- ✅ All critical bugs fixed
- ✅ WCAG 2.1 AA compliance achieved
- ✅ Production Stripe integration verified
- ✅ All documentation updated
- ✅ Release checklist completed
- ✅ Rollback plan documented

---

## Next Steps After Completion

1. **Staging Environment:**

   - Use staging for all feature testing
   - Deploy to staging before production
   - Regular staging testing cycles

2. **Launch:**

   - Complete final production deployment
   - Monitor production closely for first 48 hours
   - Be ready to rollback if needed

3. **Post-Launch:**
   - Continue using staging for new features
   - Regular production monitoring
   - Iterate based on user feedback

---

**End of Staging Environment & Launch Hardening Plan**
