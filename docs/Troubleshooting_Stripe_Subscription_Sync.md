# Troubleshooting Stripe Subscription Not Showing After Checkout

If you complete checkout but the subscription doesn't show as active, follow these steps:

---

## Step 1: Check Stripe Dashboard

1. Go to [Stripe Dashboard (Test Mode)](https://dashboard.stripe.com/test/subscriptions)
2. Find the subscription for customer `mcddsl+prod@gmail.com`
3. Verify:
   - ✅ Subscription exists
   - ✅ Status is `trialing` or `active`
   - ✅ Customer ID is present

---

## Step 2: Check Webhook Delivery

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click on your webhook endpoint
3. Check "Recent deliveries"
4. Look for `checkout.session.completed` event
5. Check if it was successful (green) or failed (red)

**If webhook failed:**
- Check the error message
- Verify `STRIPE_WEBHOOK_SECRET` in Vercel matches the webhook signing secret
- Check Vercel function logs for errors

---

## Step 3: Check Vercel Function Logs

1. Go to **Vercel Dashboard → Your Project → Functions**
2. Find `/api/billing/webhook`
3. Check recent invocations
4. Look for:
   - ✅ Successful responses (200)
   - ❌ Error messages
   - Logs showing subscription creation

**Common errors:**
- `Webhook signature verification failed` → Wrong `STRIPE_WEBHOOK_SECRET`
- `Customer not found in database` → Customer wasn't created before checkout
- `Error upserting subscription` → Database issue

---

## Step 4: Check Database

Run this query in Supabase SQL Editor:

```sql
-- Check if customer exists
SELECT * FROM billing_customers 
WHERE user_id = (
  SELECT id FROM users WHERE email = 'mcddsl+prod@gmail.com'
);

-- Check if subscription exists
SELECT bs.*, bc.user_id 
FROM billing_subscriptions bs
JOIN billing_customers bc ON bs.billing_customer_id = bc.id
WHERE bc.user_id = (
  SELECT id FROM users WHERE email = 'mcddsl+prod@gmail.com'
)
ORDER BY bs.created_at DESC;
```

**Expected results:**
- ✅ `billing_customers` row exists with `stripe_customer_id`
- ✅ `billing_subscriptions` row exists with status `trialing` or `active`

---

## Step 5: Manual Sync (If Needed)

If the webhook didn't fire or failed, you can manually sync:

1. **Get Stripe Customer ID:**
   - From Stripe Dashboard → Customers
   - Find customer for `mcddsl+prod@gmail.com`
   - Copy the Customer ID (starts with `cus_...`)

2. **Get Subscription ID:**
   - From Stripe Dashboard → Subscriptions
   - Find the subscription
   - Copy the Subscription ID (starts with `sub_...`)

3. **Use Sync Endpoint:**
   - Make a POST request to `/api/billing/sync-subscription`
   - Or use the "Sync Subscription" button in Settings (if available)

---

## Step 6: Verify Environment Variables

Make sure these are set in Vercel (Production):

```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Important:** The webhook secret must match the one in Stripe Dashboard.

---

## Common Issues & Solutions

### Issue: Webhook not receiving events
**Solution:**
- Verify webhook URL in Stripe: `https://nextbestmove.app/api/billing/webhook`
- Check that events are enabled: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`
- Test webhook delivery in Stripe Dashboard

### Issue: "Customer not found in database"
**Solution:**
- The customer should be created during checkout session creation
- Check `/api/billing/create-checkout-session` logs
- Verify `billing_customers` table has a row

### Issue: "Webhook signature verification failed"
**Solution:**
- Verify `STRIPE_WEBHOOK_SECRET` in Vercel matches the webhook signing secret
- Make sure there are no extra spaces or newlines
- Re-copy the secret from Stripe Dashboard

### Issue: Subscription exists in Stripe but not in database
**Solution:**
- Use manual sync endpoint
- Or manually insert subscription record (not recommended, use sync endpoint)

---

## Quick Fix: Manual Database Insert (Last Resort)

Only use this if webhook and sync both fail:

```sql
-- 1. Get user ID
SELECT id FROM users WHERE email = 'mcddsl+prod@gmail.com';

-- 2. Get or create billing customer
INSERT INTO billing_customers (user_id, stripe_customer_id, currency)
VALUES (
  'USER_ID_FROM_STEP_1',
  'cus_...', -- From Stripe Dashboard
  'usd'
)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Get billing_customer_id
SELECT id FROM billing_customers WHERE user_id = 'USER_ID_FROM_STEP_1';

-- 4. Insert subscription
INSERT INTO billing_subscriptions (
  billing_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  current_period_end,
  metadata
)
VALUES (
  'BILLING_CUSTOMER_ID_FROM_STEP_3',
  'sub_...', -- From Stripe Dashboard
  'price_...', -- From Stripe Dashboard → Subscription → Price
  'trialing', -- or 'active'
  NOW() + INTERVAL '14 days', -- Adjust based on trial period
  jsonb_build_object(
    'plan_name', 'Standard',
    'plan_type', 'standard',
    'interval', 'month'
  )
);
```

---

_Last updated: January 29, 2025_

