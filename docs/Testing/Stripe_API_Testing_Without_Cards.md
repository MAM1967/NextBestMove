# Stripe API Testing Without Cards (Curl Commands)

**Purpose:** Test Stripe integration using API endpoints and curl, without requiring actual payment cards  
**Date:** December 9, 2025

---

## Prerequisites

1. **Authentication Token:** Get a session token from your app
2. **User Account:** Create a test user account (for authenticated endpoints)
3. **Environment:** Production URL: `https://nextbestmove.app`

---

## Test 1: Check Environment Variables

**Purpose:** Verify Stripe keys are correctly loaded

```bash
curl https://nextbestmove.app/api/check-env | jq '.variables.STRIPE_SECRET_KEY'
```

**Expected:**

- `"mode": "LIVE"`
- `"prefix": "sk_live_..."`
- `"isLive": true`

---

## Test 2: Create Checkout Session (Without Completing)

**Purpose:** Verify checkout session creation works

**Endpoint:** `POST /api/billing/create-checkout-session`

```bash
# Get your session cookie first by logging in, or use an auth token
curl -X POST https://nextbestmove.app/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie-here" \
  -d '{
    "plan": "standard",
    "interval": "month",
    "isTrial": false
  }' | jq
```

**Expected:**

- Returns `{ "url": "https://checkout.stripe.com/..." }`
- URL should be valid Stripe checkout URL

**Note:** This creates the session but you can't complete it without a card. You're just verifying the API works.

---

## Test 3: Start Trial (No Card Required)

**Purpose:** Create a trial subscription without payment

**Endpoint:** `POST /api/billing/start-trial`

```bash
curl -X POST https://nextbestmove.app/api/billing/start-trial \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie-here" \
  -d '{
    "plan": "standard",
    "interval": "month"
  }' | jq
```

**Expected:**

- `{ "success": true, "subscriptionId": "sub_...", "trialEndsAt": "..." }`

**Verify in Stripe Dashboard:**

- Go to Stripe Dashboard → Live mode → Subscriptions
- Should see the new subscription with status "trialing"

---

## Test 4: Customer Portal Session Creation

**Purpose:** Verify billing portal can be opened (requires existing customer)

**Endpoint:** `POST /api/billing/customer-portal`

```bash
curl -X POST https://nextbestmove.app/api/billing/customer-portal \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie-here" | jq
```

**Expected:**

- `{ "url": "https://billing.stripe.com/session/..." }`
- URL should be valid Stripe billing portal URL

**Note:** Requires an existing Stripe customer. If you get "No billing customer found", create a trial first (Test 3).

---

## Test 5: Verify Price IDs

**Purpose:** Check that price IDs are correctly configured

**Test via Checkout Session:**

```bash
# Try creating checkout session with different plans
curl -X POST https://nextbestmove.app/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie-here" \
  -d '{
    "plan": "premium",
    "interval": "year",
    "isTrial": false
  }' | jq
```

**Verify in Response:**

- Session should be created successfully
- If price ID is wrong, you'll get an error about invalid price

---

## Test 6: Verify Subscription Status (Database Query)

**Purpose:** Check subscription status in your database

**Via Supabase or API (if you have an endpoint):**

```bash
# If you have a subscription status endpoint
curl https://nextbestmove.app/api/billing/subscription-status \
  -H "Cookie: your-session-cookie-here" | jq
```

**Or query Supabase directly:**

```sql
SELECT
  bs.status,
  bs.stripe_subscription_id,
  bs.current_period_end,
  bs.trial_ends_at,
  bc.stripe_customer_id
FROM billing_subscriptions bs
JOIN billing_customers bc ON bs.billing_customer_id = bc.id
JOIN users u ON bc.user_id = u.id
WHERE u.email = 'your-test-email@example.com';
```

---

## Test 7: Webhook Endpoint (Manual Simulation)

**Purpose:** Test webhook handling without actual Stripe events

**Note:** This requires creating a test webhook event manually or using Stripe CLI.

### Using Stripe CLI (if installed):

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli

# Forward webhooks to your local endpoint
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
```

### Manual Webhook Test (Production):

Create a test webhook event payload and send it:

```bash
# Get webhook secret from environment
WEBHOOK_SECRET="your-webhook-secret"

# Create test payload (simplified example)
# In practice, use Stripe CLI or Stripe Dashboard to send test events

curl -X POST https://nextbestmove.app/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=timestamp,v1=signature" \
  -d '{
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_test_...",
        "customer": "cus_test_...",
        "subscription": "sub_test_..."
      }
    }
  }'
```

**Note:** Manual webhook testing is complex due to signature verification. Use Stripe CLI or Stripe Dashboard → Webhooks → Send test webhook.

---

## Test 8: Verify Stripe Customer Creation

**Purpose:** Check if customers are created correctly in Stripe

**Via Stripe API (requires Stripe CLI or direct API access):**

```bash
# Using Stripe CLI (requires authentication)
stripe customers list --limit 5

# Or using curl with API key (not recommended in scripts, use Stripe CLI)
curl https://api.stripe.com/v1/customers \
  -u sk_live_YOUR_KEY: \
  | jq '.data[] | {id: .id, email: .email, created: .created}'
```

**Verify:**

- Customers created from your app should appear
- Email addresses should match your test users

---

## Test 9: Test Different Plan Combinations

**Purpose:** Verify all plan/interval combinations work

```bash
# Standard Monthly
curl -X POST https://nextbestmove.app/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie-here" \
  -d '{"plan": "standard", "interval": "month", "isTrial": false}'

# Standard Yearly
curl -X POST https://nextbestmove.app/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie-here" \
  -d '{"plan": "standard", "interval": "year", "isTrial": false}'

# Premium Monthly
curl -X POST https://nextbestmove.app/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie-here" \
  -d '{"plan": "premium", "interval": "month", "isTrial": false}'

# Premium Yearly
curl -X POST https://nextbestmove.app/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie-here" \
  -d '{"plan": "premium", "interval": "year", "isTrial": false}'
```

**Expected:** All should return valid checkout session URLs

---

## Test 10: Error Handling

**Purpose:** Verify error handling for invalid requests

### Invalid Plan:

```bash
curl -X POST https://nextbestmove.app/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie-here" \
  -d '{
    "plan": "invalid",
    "interval": "month"
  }' | jq
```

**Expected:** Error message about invalid plan

### Missing Authentication:

```bash
curl -X POST https://nextbestmove.app/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"plan": "standard", "interval": "month"}' | jq
```

**Expected:** `{ "error": "Unauthorized" }` with status 401

---

## Quick Test Script

Create a test script to run multiple tests:

```bash
#!/bin/bash
# test-stripe-apis.sh

BASE_URL="https://nextbestmove.app"
SESSION_COOKIE="your-session-cookie-here"

echo "🧪 Testing Stripe API Endpoints"
echo "================================"

echo ""
echo "1. Checking environment..."
curl -s "$BASE_URL/api/check-env" | jq '.variables.STRIPE_SECRET_KEY.mode'

echo ""
echo "2. Creating checkout session (standard monthly)..."
curl -s -X POST "$BASE_URL/api/billing/create-checkout-session" \
  -H "Content-Type: application/json" \
  -H "Cookie: $SESSION_COOKIE" \
  -d '{"plan": "standard", "interval": "month", "isTrial": false}' \
  | jq '.url != null'

echo ""
echo "3. Starting trial..."
curl -s -X POST "$BASE_URL/api/billing/start-trial" \
  -H "Content-Type: application/json" \
  -H "Cookie: $SESSION_COOKIE" \
  -d '{"plan": "standard", "interval": "month"}' \
  | jq '.success'

echo ""
echo "4. Creating customer portal session..."
curl -s -X POST "$BASE_URL/api/billing/customer-portal" \
  -H "Content-Type: application/json" \
  -H "Cookie: $SESSION_COOKIE" \
  | jq '.url != null'

echo ""
echo "✅ Tests complete!"
```

---

## Getting Session Cookie

To get your session cookie for testing:

1. **Browser Method:**

   - Log in to your app
   - Open Developer Tools → Application/Storage → Cookies
   - Copy the session cookie value

2. **Via Login API:**
   - Call your login endpoint
   - Extract `Set-Cookie` header from response
   - Use that cookie in subsequent requests

---

## Stripe Dashboard Verification

After running tests, verify in Stripe Dashboard (Live mode):

1. **Customers:** Should see test customers created
2. **Subscriptions:** Should see trial subscriptions
3. **Events:** Should see API calls in Events log
4. **Webhooks:** Should see webhook delivery attempts (if configured)

---

## Summary of Testable Items

✅ **Can Test Without Cards:**

- Environment variable configuration
- Checkout session creation
- Trial creation
- Customer portal access
- Price ID validation
- Error handling
- Authentication checks

❌ **Cannot Test Without Cards:**

- Actual payment processing
- Subscription activation (after trial)
- Payment method management
- Invoice generation/charging

---

## Next Steps After API Testing

1. ✅ Verify all API endpoints work
2. ✅ Confirm Stripe Dashboard shows correct data
3. ✅ Test webhooks (using Stripe CLI or Dashboard)
4. ⏭️ Then test payment flow with real card (optional)
5. ✅ Remove hardcoded workarounds once everything works

---

**Last Updated:** December 9, 2025
