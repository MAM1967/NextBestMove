# Freemium Messaging Alignment Plan

**Date:** December 24, 2025  
**Issue:** Messaging still references old 2-tier model (Standard/Premium with payment required) instead of new 3-tier freemium model (Free/Standard/Premium with reverse trial)

---

## Model Comparison

### Old Model (2-Tier)
- **Standard** - Paid plan
- **Premium** - Paid plan
- Trial expiration → **Read-only mode** (functionality freeze)
- Payment required to continue using the app

### New Model (3-Tier Freemium)
- **Free** - Always available, limited features
- **Standard** - Paid plan (14-day trial, then downgrade to Free if not subscribed)
- **Premium** - Paid plan
- Trial expiration → **Downgrade to Free tier** (not read-only, just limited features)
- Payment failure → **Read-only mode** (temporary, until payment fixed)
- Cancellation → **Read-only mode** (7 days) then Free tier

---

## Key Messaging Principles

1. **Trial Expiration** = Downgrade to Free (not read-only)
   - Users keep access to Free tier features
   - No "losing access" language
   - Focus on "upgrade to unlock" not "subscribe to keep"

2. **Payment Failure** = Read-only mode (temporary)
   - Users temporarily lose write access
   - "Update payment to restore access"
   - Different from trial expiration

3. **Cancellation** = Read-only (7 days) then Free
   - 7-day read-only grace period
   - Then downgrade to Free tier
   - Can reactivate within 30 days

---

## Files to Update

### 1. Email Templates (`web/src/lib/email/resend.ts`)

#### `sendTrialReminder` function
**Current Issues:**
- Line 127: "avoid losing access" → Should be "upgrade to unlock more features"
- Line 133: "enter read-only mode for 7 days" → Should be "downgrade to Free tier"
- Line 163: "Subscribe to resume your rhythm" → Should be "Upgrade to Standard to unlock automatic plans"

**Changes:**
- Day 14 email: Change from "losing access" to "downgrade to Free tier"
- Remove "read-only mode" references for trial expiration
- Update CTA from "Subscribe Now" to "Upgrade to Standard"

---

### 2. UI Components

#### `PaywallOverlay.tsx`
**Current Issues:**
- Line 218: "Your Standard trial has ended" → OK
- Line 221-231: Mentions "read-only mode" for grace period → Should be "Free tier"
- Line 249: "Continue in Read-Only Mode" → Should be "Continue on Free Tier"

**Changes:**
- Update grace period messaging to reference Free tier, not read-only
- Change button text from "Continue in Read-Only Mode" to "Continue on Free Tier"
- Clarify distinction between trial expiration (Free tier) and payment failure (read-only)

#### `FreeTierDowngradeBanner.tsx`
**Status:** ✅ Already correct - mentions Free tier and upgrade path

#### `GracePeriodBanner.tsx`
**Needs Review:** Check if it references read-only for trial expiration

---

### 3. Cron Jobs

#### `trial-reminders/route.ts`
**Status:** ✅ Uses `sendTrialReminder` - will be fixed when email template is updated

#### `downgrade-to-free/route.ts`
**Status:** ✅ Already correct - handles downgrade to Free tier

#### `payment-failure-recovery/route.ts`
**Status:** ✅ Already correct - handles read-only for payment failures

---

### 4. API Routes

#### `daily-plans/generate/route.ts`
**Needs Review:** Check error messages for trial expiration

---

### 5. Documentation

#### `docs/backlog.md`
**Needs Update:** References to "read-only grace period" for trial expiration should be "downgrade to Free"

#### Other docs
**Needs Review:** Search for "read-only mode" references related to trial expiration

---

## Implementation Checklist

### Phase 1: Email Templates
- [ ] Update `sendTrialReminder` in `resend.ts`
  - [ ] Day 14 email: Remove "losing access" language
  - [ ] Day 14 email: Change "read-only mode" to "Free tier"
  - [ ] Day 14 email: Update CTA to "Upgrade to Standard"
  - [ ] Day 12 email: Update messaging to align with freemium model

### Phase 2: UI Components
- [ ] Update `PaywallOverlay.tsx`
  - [ ] Grace period section: Change "read-only" to "Free tier"
  - [ ] Update button text from "Continue in Read-Only Mode" to "Continue on Free Tier"
  - [ ] Clarify distinction between trial expiration and payment failure
- [ ] Review `GracePeriodBanner.tsx`
  - [ ] Ensure it doesn't mention read-only for trial expiration

### Phase 3: API Routes
- [ ] Review `daily-plans/generate/route.ts`
  - [ ] Update error messages for trial expiration
- [ ] Review other API routes for trial-related messaging

### Phase 4: Documentation
- [ ] Update `docs/backlog.md`
- [ ] Search and update other docs that reference old model

### Phase 5: Testing
- [ ] Test Day 14 trial reminder email
- [ ] Test Day 12 trial reminder email
- [ ] Test PaywallOverlay for trial expiration
- [ ] Test PaywallOverlay for payment failure (should still show read-only)
- [ ] Verify Free tier downgrade messaging

---

## Messaging Templates

### Trial Expiration (Day 14 Email)
**Old:**
> "Today is the last day of your free trial. Subscribe now to keep your rhythm going and avoid losing access."
> "After today, your account will enter read-only mode for 7 days."

**New:**
> "Today is the last day of your Standard trial. Upgrade to Standard to keep automatic daily plans, calendar-aware capacity, and AI-assisted weekly summaries."
> "After today, you'll be on Free - Memory Relief. You can still use manual planning, but automatic features require Standard - Decision Automation."

### Trial Expiration (PaywallOverlay)
**Old:**
> "Your Standard trial has ended"
> "You have X days left to subscribe and keep your rhythm going."
> "Continue in Read-Only Mode"

**New:**
> "Your Standard trial has ended"
> "You're now on Free - Memory Relief. Upgrade to Standard - Decision Automation to unlock automatic daily plans, calendar-aware capacity, and AI-assisted weekly summaries."
> "Continue on Free Tier"

### Payment Failure (PaywallOverlay)
**Status:** ✅ Keep as-is - correctly shows read-only mode for payment failures

---

## Testing Plan

1. **Email Testing**
   - Trigger Day 14 trial reminder email
   - Verify messaging mentions Free tier, not read-only
   - Verify CTA says "Upgrade to Standard"

2. **UI Testing**
   - Test PaywallOverlay for trial expiration (should show Free tier)
   - Test PaywallOverlay for payment failure (should show read-only)
   - Verify FreeTierDowngradeBanner appears correctly

3. **Integration Testing**
   - Complete trial → Verify downgrade to Free tier
   - Verify Free tier features are accessible
   - Verify Standard features are gated

---

## Priority Order

1. **High Priority** (User-facing messaging)
   - Email templates
   - PaywallOverlay component
   - Error messages in API routes

2. **Medium Priority** (Documentation)
   - Update backlog.md
   - Update other documentation

3. **Low Priority** (Internal)
   - Code comments
   - Test descriptions

---

## Notes

- **Payment failure read-only mode is correct** - This is different from trial expiration and should remain as-is
- **Cancellation read-only mode is correct** - 7-day grace period before Free tier is appropriate
- **Focus on "upgrade to unlock"** not "subscribe to keep" for trial expiration
- **Free tier is a feature, not a limitation** - Frame it positively

