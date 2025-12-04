# Stripe Billing Testing Guide

**Status:** Ready for Testing  
**Date:** 2025-11-27

---

## Configuration Complete ✅

All Stripe environment variables are configured:
- ✅ `STRIPE_SECRET_KEY` - Test mode key
- ✅ `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- ✅ `STRIPE_PRICE_ID_STANDARD_MONTHLY` - price_1SYFH9IOD4SspTzky3YJ0aBY
- ✅ `STRIPE_PRICE_ID_STANDARD_YEARLY` - price_1SYFIDIOD4SspTzk483y8G2R
- ✅ `STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY` - price_1SYFKpIOD4SspTzkfoJTKLzG
- ✅ `STRIPE_PRICE_ID_PROFESSIONAL_YEARLY` - price_1SYFLOIOD4SspTzkSYxj5q8Y

---

## Testing Checklist

### 1. Start Local Development Server
```bash
cd web
npm run dev
```

### 2. Start Stripe Webhook Forwarding (in separate terminal)
```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

This will show you a webhook signing secret. **Make sure it matches** `STRIPE_WEBHOOK_SECRET` in your `.env.local`.

### 3. Test Checkout Flow

#### Test Standard Monthly Plan
1. Go to `/app/settings`
2. Click "Start Free Trial" (if no subscription) or "Subscribe Now"
3. Should redirect to Stripe Checkout
4. Use test card: `4242 4242 4242 4242`
5. Any future expiry date, any CVC
6. Complete checkout
7. Should redirect back to `/app/settings?checkout=success`

#### Test Trial Creation (No Credit Card)
1. The checkout session should support `isTrial: true` parameter
2. This creates a subscription with 14-day trial, no payment method required

### 4. Verify Webhook Events

Watch the `stripe listen` terminal for events:
- `checkout.session.completed` - Should fire after checkout
- `customer.subscription.created` - Should create subscription in database
- `customer.subscription.updated` - Should update subscription status

### 5. Check Database

Verify in Supabase:
```sql
-- Check billing customer was created
SELECT * FROM billing_customers WHERE user_id = 'your-user-id';

-- Check subscription was created
SELECT 
  bs.*,
  bc.user_id
FROM billing_subscriptions bs
JOIN billing_customers bc ON bs.billing_customer_id = bc.id
WHERE bc.user_id = 'your-user-id';
```

### 6. Test Subscription Status

1. Go to `/app/plan`
2. Should show paywall if no subscription
3. After subscription, should show plan normally
4. Check `/app/settings` - Billing section should show plan details

### 7. Test Customer Portal

1. Go to `/app/settings`
2. Click "Manage billing"
3. Should open Stripe Customer Portal
4. Can update payment method, cancel subscription, etc.

---

## Test Cards

Use these Stripe test cards:

**Success:**
- `4242 4242 4242 4242` - Visa (succeeds)
- `5555 5555 5555 4444` - Mastercard (succeeds)

**Decline:**
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds

**3D Secure:**
- `4000 0025 0000 3155` - Requires authentication

**Any card:**
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

---

## Testing Trial Flow

### Create Trial Subscription

The checkout endpoint supports `isTrial: true`:

```javascript
// In browser console or API test
fetch('/api/billing/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    plan: 'standard',
    interval: 'month',
    isTrial: true
  })
})
```

This should create a subscription with:
- `status: 'trialing'`
- `trial_ends_at: 14 days from now`
- No payment method required

### Test Trial Expiration

To test trial expiration without waiting 14 days:

1. In Stripe Dashboard → Customers → Select customer → Subscriptions
2. Find the subscription
3. Click "..." → "Update subscription"
4. Change trial end date to a past date
5. Save
6. This triggers `customer.subscription.updated` webhook
7. Check that subscription status updates in database

---

## Common Issues & Solutions

### Issue: "Price ID not found"
**Solution:** Verify all 4 price IDs are in `.env.local` and match Stripe dashboard

### Issue: "Webhook signature verification failed"
**Solution:** 
- Make sure `STRIPE_WEBHOOK_SECRET` matches the secret from `stripe listen`
- For production, use the webhook secret from Stripe Dashboard

### Issue: "Customer not found in database"
**Solution:** 
- Check that `billing_customers` table has RLS policies
- Verify user is authenticated when creating checkout session

### Issue: Subscription not showing in Settings
**Solution:**
- Check database for subscription record
- Verify webhook events are being received
- Check browser console for API errors

---

## Next Steps After Testing

1. ✅ Test checkout flow with test cards
2. ✅ Verify webhook events are received
3. ✅ Test trial creation
4. ✅ Test customer portal
5. ⏱ Add paywall checks to Weekly Summary page
6. ⏱ Add paywall checks to Insights page
7. ⏱ Test trial expiration and read-only mode
8. ⏱ Test payment failure recovery

---

**Ready to test!** Start your dev server and Stripe webhook forwarding, then try the checkout flow.







