# Pricing & Churn Model Integration Summary

**Date:** 2025-11-27  
**Source Document:** Trial Subscription and Churn Model.md  
**Status:** ✅ Integrated into PRD and related documentation  
**Decisions Made:** ✅ Email service (Resend), Push notifications (Yes), Stripe trial (API-based), Premium features priority

---

## Documents Updated

### 1. PRD (Product Requirements Document)
**File:** `docs/PRD/NextBestMove_PRD_v1.md`

**Changes:**
- ✅ Added Section 21: "Pricing, Subscription Tiers & Churn Model"
  - 21.1 Pricing Philosophy
  - 21.2 Subscription Tiers (Free Trial, Read-Only Grace Period, Paid Plans)
  - 21.3 Upgrade Triggers (Behavior-Based)
  - 21.4 Churn Prevention (Streak Break Detection, Payment Failure Handling, Downgrade Policy, Win-Back Campaign)
  - 21.5 Pricing Page Copy
  - 21.6 Onboarding Flow (Subscription-Aware)
  - 21.7 Subscription Model Summary
- ✅ Updated Section 6.6 to reference new pricing section
- ✅ Updated Section 19 to reference new pricing model

**Key Details Added:**
- 14-day free trial (no credit card required)
- 7-day read-only grace period after trial
- Standard Plan: $29/mo or $249/year (10 pins max)
- Premium Plan: $79/mo or $649/year (unlimited pins + premium features)
- Complete churn prevention strategy
- Win-back campaign automation

---

### 2. Backlog
**File:** `docs/backlog.md`

**Changes:**
- ✅ Updated "Final Inputs Needed" - marked pricing as confirmed
- ✅ Updated P0 items:
  - Paywall middleware (now includes trial + read-only grace period support)
  - Stripe API routes (now supports Standard/Premium, monthly/annual, trial creation)
  - Stripe webhook (now handles trial expiration, plan metadata)
  - Onboarding flow (now includes trial start step, no early pricing screens)
  - Billing section UI (marked as complete ✅)
- ✅ Added P1 items:
  - Trial expiration & read-only grace period
  - Trial reminders (Day 12 + Day 14)
  - Plan upgrade triggers (Pin limit, pattern detection, pre-call briefs, content engine)
  - Streak break detection & recovery (Day 1-3-7 flow, Micro Mode, billing pause)
  - Payment failure recovery flow (Day 0-3-7-14)
  - Win-back campaign automation (Day 7-30-90-180)
  - Premium plan features (unlimited pins, pattern detection, pre-call briefs, content engine, performance timeline)
  - Plan downgrade handling
- ✅ Added P2 items:
  - Pricing page UI
  - Billing pause feature

---

### 3. User Stories
**File:** `docs/Planning/User_Stories.md`

**Changes:**
- ✅ Updated US-11.1: Stripe Checkout Session (now supports Standard/Professional, monthly/annual)
- ✅ Updated US-11.2: Billing Webhook (now handles trial tracking, plan metadata)
- ✅ Updated US-11.3: Paywall & Feature Gating (now includes trial + read-only grace period, plan-based feature gating)
- ✅ Updated US-8.7: Complete Fast Win Step (progress updated to Step 5 of 6)
- ✅ Added US-8.8: Start 14-Day Trial Step (new Step 6 of 6)
- ✅ Renumbered US-8.8 → US-8.9: Onboarding Success Tracking
- ✅ Added US-11.6: Trial Expiration & Read-Only Grace Period
- ✅ Added US-11.7: Trial Reminders
- ✅ Added US-11.8: Plan Upgrade Triggers (Behavior-Based)
- ✅ Added US-11.9: Streak Break Detection & Recovery
- ✅ Added US-11.10: Payment Failure Recovery Flow
- ✅ Added US-11.11: Win-Back Campaign Automation

---

## Database Schema Considerations

### Fields Already Present (from initial schema):
- ✅ `billing_subscriptions.status` (enum: trialing, active, past_due, canceled)
- ✅ `billing_subscriptions.current_period_end` (for renewal dates)
- ✅ `billing_subscriptions.cancel_at_period_end` (for pending cancellations)
- ✅ `billing_subscriptions.metadata` (JSONB for plan_name, amount, etc.)

### Fields Needed (may need migration):
- ⚠️ `billing_subscriptions.trial_ends_at` (TIMESTAMPTZ) - **Check if exists**
- ⚠️ `billing_subscriptions.plan_name` (TEXT) - **May be in metadata JSONB**
- ⚠️ `billing_subscriptions.pause_ends_at` (TIMESTAMPTZ) - **For billing pause feature**

**Action Required:** Verify database schema has `trial_ends_at` field. If not, create migration.

---

## Architecture Updates Needed

### 1. Subscription Status Logic
- **Trial Active:** `status = 'trialing'` AND `trial_ends_at > now()`
- **Trial Expired (Read-Only):** `status = 'trialing'` AND `trial_ends_at < now()` AND `trial_ends_at > (now() - 7 days)`
- **Trial Expired (Inactive):** `status = 'trialing'` AND `trial_ends_at < (now() - 7 days)`
- **Active:** `status = 'active'`
- **Past Due:** `status = 'past_due'`
- **Canceled:** `status = 'canceled'`

### 2. Feature Gating Logic
- **Standard Plan Features:**
  - Daily plan generation
  - Up to 10 active pins
  - Weekly summary
  - 2 content prompts/week
  - Basic insights
- **Premium Plan Features (Standard +):**
  - Unlimited pins
  - Pattern detection
  - Pre-call briefs
  - Content engine with voice learning
  - Full performance timeline

### 3. Background Jobs Needed
- **Trial Expiration Check:** Daily job to move expired trials to read-only (triggered by Stripe webhook `customer.subscription.updated` when trial ends)
- **Trial Reminders:** Day 12 and Day 14 email (Resend) + push notifications
- **Streak Break Detection:** Daily check for missed days, trigger recovery flows (push notifications)
- **Payment Failure Recovery:** Day 0, 3, 7, 14 email (Resend) + in-app notification sequence
- **Win-Back Campaign:** Day 7, 30, 90, 180 post-cancellation emails (Resend)

### 4. Service Integrations
- **Email Service:** Resend (trial reminders, payment failures, win-back campaigns)
- **Push Notifications:** Service TBD (trial reminders, streak break detection)
- **Stripe:** Subscription management, trial handling, webhook events

---

## Next Steps Recommended

### Immediate (P0 - MVP Must-Haves):
1. **Verify Database Schema** - Check if `trial_ends_at` exists, create migration if needed
2. **Update Stripe Checkout** - Support Standard/Premium plans, monthly/annual intervals, trial creation
3. **Update Webhook Handler** - Handle trial tracking, plan metadata storage
4. **Implement Read-Only Mode** - Trial expiration logic, feature gating
5. **Update Onboarding Flow** - Add Step 6: Start 14-day trial (no credit card)
6. **Plan-Based Feature Gating** - Pin limit enforcement (10 for Standard), Premium feature checks

### High Priority (P1 - High Value):
1. **Trial Reminders** - Day 12 + Day 14 email (Resend) + push notifications
2. **Upgrade Triggers** - Pin limit modal, pattern detection gate, pre-call brief prompts
3. **Streak Break Detection** - Day 1-3-7 recovery flow (push notifications), Micro Mode, billing pause
4. **Payment Failure Recovery** - Day 0-3-7-14 sequence (Resend emails + in-app)
5. **Premium Plan Features** (in priority order):
   - **Pattern Detection** (Priority 1)
   - **Pre-Call Briefs** (Priority 2)
   - **Performance Timeline** (Priority 3)
   - **Content Engine** (Priority 4)

### Medium Priority (P2 - Nice-to-Have):
1. **Pricing Page UI** - Standard vs Premium comparison
2. **Billing Pause Feature** - 30-day pause for inactive users

---

## Key Decisions Made

1. **Trial Model:** 14 days, no credit card, full access → 7-day read-only grace → inactive
2. **Pricing:** Standard ($29/mo or $249/year) vs Premium ($79/mo or $649/year)
3. **Feature Differentiation:** Pin limits (10 vs unlimited) + Premium-only features
4. **Churn Prevention:** Active recovery flows, not passive monitoring
5. **Win-Back Strategy:** 4-touch email campaign (Day 7, 30, 90, 180)
6. **Onboarding:** No early pricing screens - let rhythm sell the plan

---

## Questions/Clarifications - RESOLVED ✅

1. **Database:** ✅ `billing_subscriptions.trial_ends_at` field exists - no migration needed
2. **Email Service:** ✅ **Resend** - Will be used for trial reminders, payment failure, and win-back campaigns
3. **Push Notifications:** ✅ **Yes** - Will be used for trial reminders and streak break detection (requires push service setup)
4. **Stripe Trial Setup:** ✅ **Stripe API** - Recommended approach (see details below)
5. **Premium Features Priority:** ✅ **Order:** 1) Pattern detection, 2) Pre-call briefs, 3) Performance timeline, 4) Content engine

### Stripe Trial Setup Recommendation

**Recommended: Stripe API with Trial Period**

**Why this is the lightest lift:**
- Stripe automatically handles trial expiration, status transitions, and webhook events
- No custom in-app trial tracking logic needed
- Stripe sends `customer.subscription.trial_will_end` and `customer.subscription.updated` events automatically
- Trial status (`trialing`) is built into Stripe's subscription model
- `trial_ends_at` is automatically set by Stripe

**Implementation:**
```typescript
// Create subscription with 14-day trial, no payment method required
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  trial_period_days: 14,
  payment_behavior: 'default_incomplete', // Allows trial without payment method
  payment_settings: {
    payment_method_types: ['card'],
    save_default_payment_method: 'on_subscription',
  },
});
```

**User Friction:**
- ✅ No credit card required during trial (Stripe supports this)
- ✅ Automatic transition from trial → active when payment method added
- ✅ Webhook handles status updates automatically
- ✅ No manual date tracking or cron jobs needed for trial expiration

**Alternative (In-App Tracking) - NOT RECOMMENDED:**
- Requires custom trial expiration logic
- Manual cron jobs to check trial dates
- More complex state management
- Higher risk of bugs/edge cases
- More user friction (manual status updates)

---

## Files Created/Modified

### Created:
- ✅ `docs/PRD/PRICING_CHURN_INTEGRATION_SUMMARY.md` (this file)

### Modified:
- ✅ `docs/PRD/NextBestMove_PRD_v1.md`
- ✅ `docs/backlog.md`
- ✅ `docs/Planning/User_Stories.md`

---

**Integration Complete:** All pricing and churn model details have been integrated into the PRD and radiated outward to backlog and user stories. Architecture considerations documented. Ready for implementation planning.

