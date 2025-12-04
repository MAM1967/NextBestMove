# Stripe Billing Setup

**Status:** ✅ Complete  
**Date:** 2025-11-27

---

## Overview

Complete Stripe billing integration with support for:
- 14-day free trial (no credit card required)
- Standard ($29/mo or $249/year) and Premium ($79/mo or $649/year) plans
- Monthly and annual billing intervals
- Read-only grace period after trial expiration
- Payment failure recovery
- Plan-based feature gating

---

## Environment Variables Required

✅ **Configured in `.env.local`:**

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_51SYEbUIOD4SspTzk... # Test mode key
STRIPE_WEBHOOK_SECRET=whsec_6418a9d876b925a4ac79fbeafb4e2808b750b6eb51422a5ed5264e8f0f93a880

# Stripe Price IDs
STRIPE_PRICE_ID_STANDARD_MONTHLY=price_1SYFH9IOD4SspTzky3YJ0aBY
STRIPE_PRICE_ID_STANDARD_YEARLY=price_1SYFIDIOD4SspTzk483y8G2R
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_1SYFKpIOD4SspTzkfoJTKLzG
STRIPE_PRICE_ID_PREMIUM_YEARLY=price_1SYFLOIOD4SspTzkSYxj5q8Y

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000 # or your production URL
```

**Note:** For production, add these same variables to Vercel environment variables (use live mode keys).

---

## Files Created

### API Routes
- `web/src/app/api/billing/create-checkout-session/route.ts` - Creates Stripe checkout session
- `web/src/app/api/billing/customer-portal/route.ts` - Opens Stripe customer portal
- `web/src/app/api/billing/webhook/route.ts` - Handles Stripe webhook events
- `web/src/app/api/billing/subscription/route.ts` - Returns current subscription status

### Utilities
- `web/src/lib/billing/stripe.ts` - Stripe client and plan configuration
- `web/src/lib/billing/subscription.ts` - Subscription status checking and feature gating

### Components
- `web/src/app/app/components/PaywallOverlay.tsx` - Paywall overlay component

---

## API Endpoints

### POST `/api/billing/create-checkout-session`

Creates a Stripe checkout session.

**Request Body:**
```json
{
  "plan": "standard" | "premium",
  "interval": "month" | "year",
  "isTrial": boolean // Optional, defaults to false
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### POST `/api/billing/customer-portal`

Creates a Stripe customer portal session.

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

### POST `/api/billing/webhook`

Handles Stripe webhook events. Must be configured in Stripe dashboard.

**Events Handled:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

### GET `/api/billing/subscription`

Returns current subscription status.

**Response:**
```json
{
  "status": "trialing" | "active" | "past_due" | "canceled" | "none",
  "plan": "standard" | "premium" | "none",
  "trialEndsAt": "2025-12-11T00:00:00Z" | null,
  "currentPeriodEnd": "2025-12-11T00:00:00Z" | null,
  "cancelAtPeriodEnd": false,
  "isReadOnly": false
}
```

---

## Subscription Status Logic

### Trial Active
- `status = 'trialing'` AND `trial_ends_at > now()`
- Full access to all features

### Trial Expired (Read-Only Grace Period)
- `status = 'trialing'` AND `trial_ends_at < now()` AND `trial_ends_at > (now() - 7 days)`
- Can view data, cannot create new plans/pins/actions
- Shows paywall overlay

### Trial Expired (Inactive)
- `status = 'trialing'` AND `trial_ends_at < (now() - 7 days)`
- No access

### Active
- `status = 'active'`
- Full access

### Past Due
- `status = 'past_due'`
- Shows payment failure modal
- Read-only after 7 days

### Canceled
- `status = 'canceled'`
- Shows reactivation prompt

---

## Feature Gating

### Standard Plan Features
- Daily plan generation
- Up to 10 active pins
- Weekly summary
- 2 content prompts/week
- Basic insights

### Premium Plan Features (Standard +)
- Unlimited pins
- Pattern detection
- Pre-call briefs
- Content engine with voice learning
- Full performance timeline

---

## Usage Examples

### Check Subscription Status
```typescript
import { getSubscriptionInfo } from "@/lib/billing/subscription";

const subscription = await getSubscriptionInfo(userId);
if (subscription.status === "none") {
  // Show paywall
}
```

### Check Feature Access
```typescript
import { hasFeatureAccess } from "@/lib/billing/subscription";

const canGeneratePlan = await hasFeatureAccess(userId, "daily_plan");
if (!canGeneratePlan) {
  // Show paywall
}
```

### Check Professional Feature
```typescript
import { hasProfessionalFeature } from "@/lib/billing/subscription";

const canUsePatternDetection = await hasProfessionalFeature(
  userId,
  "pattern_detection"
);
```

### Check Pin Limit
```typescript
import { checkPinLimit } from "@/lib/billing/subscription";

const pinLimit = await checkPinLimit(userId);
if (!pinLimit.canAdd) {
  // Show upgrade prompt
}
```

---

## Stripe Dashboard Setup

1. **Create Products & Prices:**
   - Standard Monthly: $29/month
   - Standard Yearly: $249/year
   - Professional Monthly: $79/month
   - Professional Yearly: $649/year

2. **Configure Webhook:**
   - URL: `https://yourdomain.com/api/billing/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`

3. **Get Webhook Signing Secret:**
   - Copy the webhook signing secret
   - Add to `STRIPE_WEBHOOK_SECRET` env var

---

## Testing

### Test Mode
- Use Stripe test mode keys
- Test cards: https://stripe.com/docs/testing
- Test webhook events using Stripe CLI:
  ```bash
  stripe listen --forward-to localhost:3000/api/billing/webhook
  ```

### Production
- Use Stripe live mode keys
- Configure webhook endpoint in Stripe dashboard
- Ensure all environment variables are set in Vercel

---

## Next Steps

1. **Create Stripe Products & Prices** in Stripe dashboard
2. **Add Price IDs** to environment variables
3. **Configure Webhook** endpoint in Stripe dashboard
4. **Test checkout flow** with test cards
5. **Test webhook events** using Stripe CLI or dashboard
6. **Add paywall checks** to other gated pages (weekly summary, insights)

---

## Integration Points

- ✅ BillingSection component (Settings page)
- ✅ PaywallOverlay component (Plan page)
- ⏱ Weekly Summary page (needs paywall check)
- ⏱ Insights page (needs paywall check)
- ⏱ Pin limit enforcement (needs upgrade prompt)
- ⏱ Professional feature gates (pattern detection, pre-call briefs, etc.)

---

**Implementation Complete:** All core Stripe billing infrastructure is in place and ready for testing.

