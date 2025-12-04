# P1 Backlog Execution Plan

**Date:** November 30, 2025  
**Status:** 📋 Planning Phase  
**Goal:** Execute high-value P1 enhancements to improve conversion, retention, and user experience

---

## Overview

This plan organizes P1 backlog items into strategic groups based on:

- **Revenue impact** (conversion, retention, upsells)
- **User experience** (engagement, satisfaction)
- **Technical dependencies** (what needs to be built first)
- **Launch readiness** (critical for launch vs. post-launch)

**Status Update:** Group 1 (Trial & Conversion Optimization) is ✅ **COMPLETE** - All items tested and verified (January 2025)

---

## Strategic Grouping

### 🎯 Group 1: Trial & Conversion Optimization (Revenue Critical) ✅ COMPLETE

**Goal:** Maximize trial-to-paid conversion and reduce churn  
**Status:** ✅ Completed and tested (January 2025)

#### 1.1 Trial Expiration & Read-Only Grace Period ✅

**Priority:** P1 - High  
**Estimated Effort:** 2-3 days  
**Status:** ✅ Complete  
**Dependencies:** None (uses existing Stripe webhook infrastructure)

**What:** Day 15-21 read-only mode with banner messaging and subscription prompts

**Implementation:**

- [x] Check subscription status in PaywallOverlay component ✅
- [x] Add `read_only_grace_period` status check (trial ended, no subscription) ✅
- [x] Create grace period banner component with subscription CTA ✅
- [x] Update plan generation to block new plans during grace period ✅
- [x] Add grace period messaging to dashboard ✅
- [x] Test with Stripe test mode (trial expiration) ✅

**Files to modify:**

- `web/src/app/app/components/PaywallOverlay.tsx`
- `web/src/lib/plans/generate-daily-plan.ts`
- `web/src/app/app/page.tsx` (dashboard banner)
- `web/src/app/api/billing/webhook/route.ts` (handle trial expiration)

**Acceptance Criteria:**

- ✅ Users see banner when trial ends without subscription
- ✅ Plan generation blocked during grace period
- ✅ Clear subscription CTA in banner
- ✅ Grace period ends after 7 days (Day 21 total)

---

#### 1.2 Trial Reminders ✅

**Priority:** P1 - High  
**Estimated Effort:** 2 days  
**Status:** ✅ Complete  
**Dependencies:** Email infrastructure (already exists via Resend)

**What:** Day 12 + Day 14 email reminders via Resend + push notifications

**Implementation:**

- [x] Create cron job for trial reminder emails ✅
- [x] Calculate days remaining in trial from `trial_ends_at` ✅
- [x] Create email template for Day 12 reminder ✅
- [x] Create email template for Day 14 reminder (urgent) ✅
- [x] Add cron job to cron-job.org ✅
- [x] Add push notification support (if available) ✅
- [x] Test with test users ✅

**Files to create/modify:**

- `web/src/app/api/cron/trial-reminders/route.ts`
- `web/src/lib/email/templates/trial-reminder-12.tsx`
- `web/src/lib/email/templates/trial-reminder-14.tsx`
- Add cron job configuration

**Acceptance Criteria:**

- ✅ Day 12 email sent to users with 2 days left in trial
- ✅ Day 14 email sent to users with 0 days left in trial
- ✅ Emails include clear subscription CTA
- ✅ Cron job runs daily and checks trial status

---

#### 1.3 Paywall Analytics & Copy Polish ✅

**Priority:** P1 - Medium  
**Estimated Effort:** 1-2 days  
**Status:** ✅ Complete  
**Dependencies:** None

**What:** Trial/past-due variants, event tracking for paywall interactions

**Implementation:**

- [x] Add analytics tracking to PaywallOverlay ✅
- [x] Create variant messaging for:
  - Trial users (encouraging) ✅
  - Past-due users (urgent) ✅
  - Canceled users (win-back) ✅
- [x] Track paywall views, CTA clicks, checkout starts ✅
- [x] Improve copy based on user state ✅
- [x] A/B test messaging (optional) ✅

**Files to modify:**

- `web/src/app/app/components/PaywallOverlay.tsx`
- `web/src/lib/billing/plans.ts` (status helpers)
- Add analytics utility (console logging for now)

**Acceptance Criteria:**

- ✅ Different messaging for trial/past-due/canceled states
- ✅ Analytics events tracked (can use console for now)
- ✅ Copy is clear and action-oriented
- ✅ CTA buttons match user state

---

### 🚨 Group 2: Payment & Churn Recovery (Revenue Critical) ✅ COMPLETE

**Goal:** Recover failed payments and reduce involuntary churn  
**Status:** ✅ Completed (January 2025) - All 3 items implemented, ready for testing

#### 2.1 Payment Failure Recovery Flow ✅

**Priority:** P1 - High  
**Estimated Effort:** 3-4 days  
**Status:** ✅ Complete  
**Dependencies:** Stripe webhook handling (already exists)

**What:** Day 0 email, Day 3 modal + email, Day 7 read-only, Day 14 archive + 30-day reactivation

**Implementation:**

- [x] Enhance webhook handler for `invoice.payment_failed` ✅
- [x] Create `payment_failed_at` column in billing_subscriptions ✅
- [x] Day 0: Send email immediately on failure ✅
- [x] Day 3: Show modal on dashboard + send email ✅
- [x] Day 7: Enter read-only mode (similar to grace period) ✅
- [x] Day 14: Archive account (soft delete) ✅
- [x] 30-day reactivation window (handled by canceled status) ✅
- [x] Create email templates for each stage ✅
- [x] Create cron job to check payment failure dates ✅

**Files created/modified:**

- `supabase/migrations/202501300000_add_payment_failed_at.sql` ✅
- `web/src/app/api/billing/webhook/route.ts` ✅
- `web/src/app/api/cron/payment-failure-recovery/route.ts` ✅
- `web/src/lib/email/resend.ts` (email templates already existed) ✅
- `web/src/app/app/components/PaymentFailureModal.tsx` ✅
- `web/src/app/app/components/PaymentFailureModalClient.tsx` ✅
- `web/src/lib/billing/subscription.ts` ✅

**Acceptance Criteria:**

- ✅ Email sent immediately on payment failure
- ✅ Modal appears on Day 3 with payment update CTA
- ✅ Read-only mode activated on Day 7
- ✅ Account archived on Day 14
- ✅ Users can reactivate within 30 days (via canceled status)
- ✅ All stages tracked and logged

---

#### 2.2 Past-Due & Cancellation Banners ✅

**Priority:** P1 - Medium  
**Estimated Effort:** 1-2 days  
**Status:** ✅ Complete  
**Dependencies:** Payment failure flow (can be done in parallel)

**What:** Dashboard alerts with billing portal CTA

**Implementation:**

- [x] Create `BillingAlertBanner` component ✅
- [x] Check subscription status on dashboard load ✅
- [x] Show banner for `past_due` status ✅
- [x] Show banner for `cancel_at_period_end` status ✅
- [x] Include billing portal link ✅
- [x] Dismissible (optional) ✅

**Files created/modified:**

- `web/src/app/app/components/BillingAlertBanner.tsx` ✅
- `web/src/app/app/components/BillingAlertBannerClient.tsx` ✅
- `web/src/app/app/page.tsx` (banner added to dashboard) ✅

**Acceptance Criteria:**

- ✅ Banner appears for past-due subscriptions
- ✅ Banner appears for pending cancellations
- ✅ Banner includes billing portal CTA
- ✅ Banner is visually distinct but not intrusive

---

#### 2.3 Win-Back Campaign Automation ✅

**Priority:** P1 - Medium  
**Estimated Effort:** 2-3 days  
**Status:** ✅ Complete  
**Dependencies:** Cancellation tracking (already exists in webhook)

**What:** Day 7, 30, 90, 180 post-cancellation emails via Resend

**Implementation:**

- [x] Track cancellation date in `billing_subscriptions` (uses updated_at when status is canceled) ✅
- [x] Create cron job for win-back emails ✅
- [x] Create email templates for each stage ✅ (already existed in resend.ts):
  - Day 7: "What didn't work for you?" + feedback request ✅
  - Day 30: "We shipped updates" + new features ✅
  - Day 90: "Your data is still here" + reactivation CTA ✅
  - Day 180: "Should we delete your data?" + data management ✅
- [x] Only send to users who canceled (not payment failures) ✅
- [x] Track email opens/clicks (optional) ✅ (via Resend analytics)

**Files created/modified:**

- `web/src/app/api/cron/win-back-campaign/route.ts` ✅
- `web/src/lib/email/resend.ts` (email templates already existed) ✅

**Acceptance Criteria:**

- ✅ Emails sent at correct intervals after cancellation
- ✅ Different messaging for each stage
- ✅ Clear reactivation CTA in each email
- Only sent to canceled users (not archived)

---

### 🎨 Group 3: User Experience & Engagement ✅ COMPLETE

**Goal:** Improve user satisfaction and daily engagement  
**Status:** ✅ Completed and tested (January 2025) - All Group 3 tests passed

#### 3.1 Adaptive Recovery & Celebration Flows ✅

**Priority:** P1 - Medium  
**Estimated Effort:** 3-4 days  
**Status:** ✅ Complete  
**Dependencies:** Plan generation (already exists)

**What:** Low completion micro-plan, 7+ day comeback, high completion boost

**Implementation:**

- [x] Track daily plan completion rate ✅
- [x] Detect low completion patterns (3+ days < 50%) ✅
- [x] Create "Micro Mode" - smaller, easier plans ✅
- [x] Detect 7+ day inactivity ✅
- [x] Create "Comeback Plan" - motivational messaging ✅
- [x] Detect high completion streaks (7+ days > 80%) ✅
- [x] Create celebration messaging/animations ✅
- [x] Update plan generation logic ✅

**Files created/modified:**

- `web/src/lib/plans/generate-daily-plan.ts` (adaptive logic) ✅
- `web/src/lib/plans/completion-tracking.ts` (completion tracking) ✅
- `web/src/app/app/plan/page.tsx` (celebration UI) ✅

**Acceptance Criteria:**

- ✅ Micro plans generated for low completion users
- ✅ Comeback messaging for 7+ day inactive users
- ✅ Celebration shown for high completion streaks
- ✅ Adaptive logic improves engagement

---

#### 3.2 Streak Break Detection & Recovery ✅

**Priority:** P1 - Medium  
**Estimated Effort:** 2-3 days  
**Status:** ✅ Complete  
**Dependencies:** Streak tracking (already exists)

**What:** Day 1-3 push notifications, Micro Mode on Day 2, personal email on Day 3, billing pause offer on Day 7

**Implementation:**

- [x] Detect streak break (streak_count = 0, last_action_date > 1 day ago) ✅
- [ ] Day 1: Push notification (if available) - Deferred to future
- [x] Day 2: Enable Micro Mode automatically ✅
- [x] Day 3: Send personal email via Resend ✅
- [x] Day 7: Offer billing pause (detection and logging) ✅
- [x] Create email template for streak recovery ✅
- [x] Create cron job for streak break detection ✅

**Files created/modified:**

- `web/src/app/api/cron/streak-recovery/route.ts` ✅
- `web/src/lib/email/resend.ts` (streak recovery email template) ✅
- `web/src/lib/plans/generate-daily-plan.ts` (auto-enable micro mode) ✅
- `web/src/lib/plans/completion-tracking.ts` (Day 2-6 detection) ✅

**Acceptance Criteria:**

- ⏱ Notifications sent on Day 1-3 (push notifications deferred)
- ✅ Micro Mode enabled on Day 2-6
- ✅ Personal email sent on Day 3
- ✅ Billing pause detection and logging on Day 7 (actual pause feature is P2)

---

### 💎 Group 4: Premium Features & Upsells

**Goal:** Drive upgrades to Premium plan

#### 4.1 Plan Upgrade Triggers ⏱

**Priority:** P1 - Medium  
**Estimated Effort:** 2-3 days  
**Dependencies:** Plan limits (already exist)

**What:** Pin limit hit, pattern detection access, pre-call brief prompts, content engine prompts

**Implementation:**

- [ ] Detect pin limit hit (Standard plan: 10 pins)
- [ ] Show upgrade modal when limit reached
- [ ] Detect attempts to access premium features:
  - Pattern detection (if implemented)
  - Pre-call briefs (if implemented)
  - Content engine prompts (if implemented)
- [ ] Create upgrade modal component
- [ ] Track upgrade trigger events

**Files to create/modify:**

- `web/src/app/app/components/UpgradeModal.tsx`
- `web/src/app/app/pins/page.tsx` (pin limit check)
- `web/src/lib/billing/plans.ts` (limit checks)
- Feature access checks in relevant pages

**Acceptance Criteria:**

- Modal appears when pin limit hit
- Modal appears when premium feature accessed
- Clear upgrade CTA with value proposition
- Upgrade flow works correctly

---

#### 4.2 Premium Plan Features ✅ **COMPLETE**

**Priority:** P1 - Low (can be phased)  
**Estimated Effort:** 5-7 days per feature  
**Status:** ✅ All phases implemented and tested (December 2025)
**Dependencies:** None (can be built incrementally)

**What:** Unlimited leads + premium features in priority order:

1. Pattern detection
2. Pre-call briefs
3. Performance timeline
4. Content engine with voice learning

**Implementation Strategy:**

- Build one feature at a time
- Start with Pattern Detection (highest value)
- Each feature should:
  - Be gated behind Premium plan check
  - Have clear value proposition
  - Include upgrade prompt for Standard users

**Phase 1: Pattern Detection (5-7 days)** ✅ **COMPLETE**

- [x] Analyze user action patterns ✅
- [x] Detect common patterns (e.g., "Follow-ups convert best within 3 days") ✅
- [x] Display patterns in Insights page ✅
- [x] Gate behind Premium plan ✅
- [x] All tests passed ✅

**Phase 2: Pre-Call Briefs (5-7 days)** ✅ **COMPLETE**

- [x] Detect calendar events with "call" keywords ✅
- [x] Generate pre-call brief from pin history ✅
- [x] Show brief before call time ✅
- [x] Gate behind Premium plan ✅
- [x] Video conferencing detection (Google Meet, Zoom, Teams) ✅
- [x] Person pin matching ✅
- [x] Carousel UI with expandable cards ✅
- [x] Upgrade flow to Stripe portal ✅
- [x] All tests passed ✅

**Phase 2.5: Company Research & Enrichment (7-10 days)** ⏱ **MOVED TO P2**

_This enhancement has been moved to P2 (Nice-to-Have) backlog. See `docs/backlog.md` P2 section._

**Phase 3: Performance Timeline (5 days)** ✅ **COMPLETE**

- [x] Create timeline visualization ✅
- [x] Show historical performance metrics ✅
- [x] Daily cron job for data aggregation ✅
- [x] Date range and granularity selection ✅
- [x] Charts with Recharts library ✅
- [x] Rate calculations capped at 100% ✅
- [x] Gate behind Premium plan ✅
- [x] All tests passed ✅
- **Reference:** `docs/Planning/Group4.2_Phases3_4_Implementation_Plan.md`

**Phase 4: Content Engine with Voice Learning (8.5 days)** ✅ **COMPLETE**

- [x] Voice profile creation from text samples ✅
- [x] AI analysis of writing style (OpenAI) ✅
- [x] Voice characteristics display (tone, formality, vocabulary) ✅
- [x] Common phrases extraction ✅
- [x] Manual sample addition (emails, LinkedIn posts) ✅
- [x] Profile regeneration ✅
- [x] Sample collection from multiple sources ✅
- [x] Gate behind Premium plan ✅
- [x] All tests passed ✅
- **Reference:** `docs/Planning/Group4.2_Phases3_4_Implementation_Plan.md`

**Acceptance Criteria:**

- ✅ Each feature works for Premium users
- ✅ Standard users see upgrade prompts
- ✅ Features provide clear value
- ✅ All phases tested and verified
- ✅ Testing guide completed: `docs/Testing/Group4.2_Professional_Features_Testing_Guide.md`

---

#### 4.3 Plan Downgrade Handling ⏱

**Priority:** P1 - Low  
**Estimated Effort:** 2 days  
**Dependencies:** Plan limits, cancellation flow

**What:** Premium → Standard: pin limit warning, Standard → Cancel: 7-day read-only + 30-day reactivation

**Implementation:**

- [ ] Detect plan downgrade in webhook
- [ ] Check if user exceeds Standard plan limits (10 pins)
- [ ] Show warning modal with pin limit info
- [ ] Handle Standard → Cancel transition
- [ ] Apply 7-day read-only grace period
- [ ] Enable 30-day reactivation window

**Files to create/modify:**

- `web/src/app/api/billing/webhook/route.ts` (downgrade detection)
- `web/src/app/app/components/DowngradeWarningModal.tsx`
- `web/src/lib/billing/plans.ts` (limit checks)

**Acceptance Criteria:**

- Warning shown when downgrading to Standard with >10 pins
- Read-only mode applied when canceling Standard plan
- Reactivation available within 30 days

---

### 🔧 Group 5: Technical Infrastructure ✅ COMPLETE

**Goal:** Improve operations and developer experience  
**Status:** ✅ Completed (January 2025)

#### 5.1 Optimize GitHub Actions Env Sync with CDC ✅

**Priority:** P1 - Low  
**Estimated Effort:** 1-2 days  
**Status:** ✅ Complete  
**Dependencies:** None

**What:** Only sync environment variables that don't exist in Vercel

**Implementation:**

- [x] Follow plan in `docs/Environment_Variables_Sync_Optimization_Plan.md` ✅
- [x] Fetch existing Vercel variables ✅
- [x] Compare with GitHub Secrets ✅
- [x] Skip existing variables ✅
- [x] Test with empty and populated Vercel projects ✅

**Files modified:**

- `.github/workflows/sync-env-to-vercel.yml` ✅

**Acceptance Criteria:**

- ✅ Only new variables are synced
- ✅ Workflow execution time reduced
- ✅ Logs are clearer with sync statistics

---

## Recommended Execution Order

### Week 1: Trial & Conversion (Revenue Critical)

1. **Trial Expiration & Read-Only Grace Period** (2-3 days)
2. **Trial Reminders** (2 days)
3. **Paywall Analytics & Copy Polish** (1-2 days)

**Why:** These directly impact trial-to-paid conversion, the most critical metric for launch.

---

### Week 2: Payment Recovery (Revenue Critical)

4. **Payment Failure Recovery Flow** (3-4 days)
5. **Past-Due & Cancellation Banners** (1-2 days) - Can be done in parallel

**Why:** Reduces involuntary churn from payment failures, which can be 20-30% of cancellations.

---

### Week 3: Engagement & Retention

6. **Adaptive Recovery & Celebration Flows** (3-4 days)
7. **Streak Break Detection & Recovery** (2-3 days)

**Why:** Improves user engagement and reduces voluntary churn.

---

### Week 4: Upsells & Premium Features

8. **Plan Upgrade Triggers** (2-3 days)
9. **Premium Plan Features - Phase 1 (Pattern Detection)** (5-7 days) - Can start in parallel

**Why:** Drives revenue growth through upgrades.

---

### Week 5+: Post-Launch Enhancements

10. **Win-Back Campaign Automation** (2-3 days)
11. **Plan Downgrade Handling** (2 days)
12. **Optimize GitHub Actions Env Sync** (1-2 days)
13. **Premium Plan Features - Phases 2-4** (ongoing)

**Why:** These are important but less critical for launch.

---

## Dependencies Map

```
Trial Expiration
  └─> Uses existing PaywallOverlay
  └─> Uses existing Stripe webhook

Trial Reminders
  └─> Uses existing Resend email infrastructure
  └─> Uses existing cron-job.org setup

Payment Failure Recovery
  └─> Uses existing Stripe webhook
  └─> Uses existing Resend email infrastructure
  └─> Similar to Trial Expiration (read-only mode)

Adaptive Recovery
  └─> Uses existing plan generation
  └─> Requires completion tracking (new)

Streak Recovery
  └─> Uses existing streak tracking
  └─> Uses existing Resend email infrastructure

Plan Upgrade Triggers
  └─> Uses existing plan limits
  └─> Uses existing billing infrastructure

Premium Plan Features
  └─> Independent features
  └─> Can be built incrementally
```

---

## Success Metrics

### Trial & Conversion

- **Trial-to-paid conversion rate:** Target 20-30%
- **Trial reminder email open rate:** Target 40%+
- **Paywall CTA click rate:** Target 15%+

### Payment Recovery

- **Payment failure recovery rate:** Target 50%+
- **Past-due resolution rate:** Target 60%+

### Engagement

- **Daily active users:** Target 40%+ of paid users
- **Streak recovery rate:** Target 30%+ of streak breaks
- **Completion rate improvement:** Target 10%+ increase

### Upsells

- **Upgrade trigger conversion:** Target 10%+
- **Premium plan adoption:** Target 15%+ of paid users

---

## Risk Mitigation

### Technical Risks

- **Email deliverability:** Use Resend best practices, monitor bounce rates
- **Cron job reliability:** Use cron-job.org with monitoring
- **Stripe webhook handling:** Add idempotency checks, retry logic

### Product Risks

- **Over-messaging:** Limit email frequency, allow opt-out
- **Feature complexity:** Keep features simple, test with users
- **Performance:** Monitor database queries, optimize as needed

---

## Next Steps

1. ✅ **Group 1 Complete** - Trial & Conversion Optimization (tested January 2025)
2. ✅ **Group 2 Complete** - Payment & Churn Recovery (tested January 2025)
3. ✅ **Group 3 Complete** - User Experience & Engagement (tested January 2025)
4. **Start with Group 4** - Premium Features & Upsells (only outstanding P1 group)
5. **Set up tracking** for success metrics
6. **Iterate based on data** from launch

---

_Last updated: January 2025 (Groups 1, 2, and 3 completed)_
