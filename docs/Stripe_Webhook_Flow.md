# Stripe Webhook Flow - Production Verification

**Date:** January 29, 2025  
**Status:** Fixed - Webhook now uses admin client to bypass RLS

---

## Expected Flow (Production)

1. **User clicks "Start Free Trial"**
   - Creates Stripe checkout session
   - Redirects to Stripe hosted checkout

2. **User completes checkout**
   - Stripe creates subscription
   - Stripe sends `checkout.session.completed` webhook

3. **Webhook handler receives event** (automatic)
   - Uses **admin client** (service role key) to bypass RLS
   - Fetches subscription from Stripe
   - Creates/updates `billing_subscriptions` record
   - User's subscription is now active

4. **User redirected back to settings**
   - Settings page queries `billing_subscriptions`
   - Subscription appears automatically
   - No manual sync needed

---

## Key Fix Applied

**Problem:** Webhook was using anon key client, which requires user auth. Webhooks have no user session, so RLS blocked INSERT/UPDATE operations.

**Solution:** Webhook now uses **admin client** (service role key) which bypasses RLS, allowing webhook to create subscriptions automatically.

**Files Changed:**
- `web/src/lib/supabase/admin.ts` - New admin client
- `web/src/app/api/billing/webhook/route.ts` - Uses admin client
- `web/src/app/api/billing/sync-subscription/route.ts` - Uses admin client for updates

---

## Verification Steps (Production)

### 1. Test Checkout Flow

1. Go to Settings → Billing
2. Click "Start Free Trial"
3. Complete checkout in Stripe
4. Wait 5-10 seconds (webhook delivery)
5. Refresh settings page
6. **Expected:** Subscription appears automatically

### 2. Check Vercel Function Logs

1. Go to **Vercel Dashboard → Project → Functions**
2. Find `/api/billing/webhook`
3. Check recent invocations after checkout
4. Look for log messages:
   - `🔄 Processing checkout.session.completed`
   - `✅ Found customer in database`
   - `✅ Retrieved subscription from Stripe`
   - `✅ Subscription successfully saved to database`

### 3. Check Stripe Webhook Delivery

1. Go to **Stripe Dashboard → Webhooks**
2. Click on your webhook endpoint
3. Check "Recent deliveries"
4. Look for `checkout.session.completed` event
5. **Expected:** Status is "Succeeded" (green)

### 4. Verify Database

Run in Supabase SQL Editor:

```sql
-- Check subscription was created
SELECT 
  bs.*,
  bc.user_id,
  u.email
FROM billing_subscriptions bs
JOIN billing_customers bc ON bs.billing_customer_id = bc.id
JOIN users u ON bc.user_id = u.id
WHERE u.email = 'your-email@example.com'
ORDER BY bs.created_at DESC
LIMIT 1;
```

**Expected:** Row exists with `status = 'trialing'` or `'active'`

---

## Fallback: Sync Subscription Button

The "Sync Subscription" button in the UI is a **fallback only** for edge cases:
- Webhook delivery delayed
- Webhook failed (rare)
- Manual recovery needed

**In production, this should rarely be needed** - the webhook should handle everything automatically.

---

## Troubleshooting

### Subscription doesn't appear after checkout

1. **Check webhook delivery in Stripe:**
   - If failed → Check webhook secret matches Vercel
   - If not delivered → Check webhook URL is correct

2. **Check Vercel function logs:**
   - Look for errors in `/api/billing/webhook`
   - Check for RLS errors (shouldn't happen with admin client)

3. **Check database:**
   - Verify `billing_customers` row exists
   - Check if `billing_subscriptions` row was created

4. **Manual sync:**
   - Use "Sync Subscription" button as fallback
   - Or call `/api/billing/sync-subscription` endpoint

---

## Production Checklist

Before going live, verify:

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel (Production)
- [ ] `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- [ ] Webhook URL is correct: `https://nextbestmove.app/api/billing/webhook`
- [ ] Webhook events are enabled: `checkout.session.completed`, `customer.subscription.*`
- [ ] Test checkout flow works end-to-end
- [ ] Subscription appears automatically (no sync button needed)
- [ ] Vercel function logs show successful webhook processing

---

_Last updated: January 29, 2025_

