# Stripe Test Mode vs Live Mode Guide

**Date:** January 29, 2025  
**Domain:** nextbestmove.app

---

## Recommendation: Start with Test Mode

Since you're deploying to production but won't have real users for a couple of weeks, **use Stripe test mode initially**. This allows you to:

✅ Test the complete payment flow without real charges  
✅ Verify webhooks work correctly  
✅ Test subscription management  
✅ Switch to live mode easily when ready  

---

## Test Mode Setup (Initial Launch)

### Environment Variables in Vercel

Set these for **Production** environment (but using test keys):

```
STRIPE_SECRET_KEY=sk_test_... (from Stripe Dashboard → Developers → API keys → Test mode)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe Dashboard → Developers → Webhooks → Test mode endpoint)
```

**Note:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is **NOT required**. This app uses Stripe Checkout (hosted checkout page), not Stripe Elements (embedded forms). The checkout session is created server-side using the secret key, and users are redirected to Stripe's hosted checkout page.

### Webhook Configuration (Test Mode)

1. Go to: **[Stripe Dashboard (Test Mode)](https://dashboard.stripe.com/test/webhooks)**
2. Click **Add endpoint**
3. **Endpoint URL:** `https://nextbestmove.app/api/billing/webhook`
4. **Events:** Select all billing-related events
5. Copy the **Signing secret** → Add to Vercel as `STRIPE_WEBHOOK_SECRET`

### Testing in Test Mode

**Test Cards (use these in checkout):**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

**Test Email:** Use any email (e.g., `test@example.com`)

---

## Switching to Live Mode (When Ready)

### When to Switch

Switch to live mode when:
- ✅ You're ready to accept real payments
- ✅ You have real users signing up
- ✅ You've thoroughly tested in test mode
- ✅ You've verified webhooks work correctly

### Steps to Switch

1. **Get Live Mode Keys:**
   - Go to: **[Stripe Dashboard (Live Mode)](https://dashboard.stripe.com/)**
   - Navigate to: **Developers → API keys**
   - Copy **Live mode** keys (starts with `sk_live_` and `pk_live_`)

2. **Create Live Mode Webhook:**
   - Go to: **Developers → Webhooks**
   - Click **Add endpoint**
   - URL: `https://nextbestmove.app/api/billing/webhook`
   - Select events (same as test mode)
   - Copy **Signing secret**

3. **Update Vercel Environment Variables:**
   - Replace test keys with live keys
   - Update `STRIPE_WEBHOOK_SECRET` with live webhook secret
   - **Important:** Redeploy after updating

4. **Verify:**
   - Test checkout with a real card (small amount)
   - Verify webhook receives events
   - Check subscription status updates correctly

---

## Important Notes

### Test Mode in Production
- ✅ **Safe:** No real charges will occur
- ✅ **Testable:** You can test the complete flow
- ⚠️ **User Experience:** Users will see "Test Mode" in Stripe checkout (if visible)
- ⚠️ **Webhooks:** Must use test mode webhook secret

### Live Mode
- ⚠️ **Real Charges:** Real payments will be processed
- ⚠️ **Irreversible:** Once in live mode, charges are real
- ✅ **Production Ready:** Users see normal checkout
- ✅ **Real Webhooks:** Must use live mode webhook secret

### Best Practice
1. **Deploy with test mode** initially
2. **Test thoroughly** with test cards
3. **Switch to live mode** when ready for real users
4. **Keep test mode webhook** for testing (you can have both)

---

## Testing Checklist (Test Mode)

Before switching to live mode, verify:

- [ ] "Start Free Trial" button works
- [ ] Stripe checkout redirects correctly
- [ ] Test card payment succeeds
- [ ] Webhook receives `checkout.session.completed` event
- [ ] Subscription is created in database
- [ ] User can access premium features
- [ ] Billing portal access works
- [ ] Subscription cancellation works
- [ ] Webhook handles all event types correctly

---

## Quick Reference

| Item | Test Mode | Live Mode |
|------|-----------|-----------|
| **Secret Key** | `sk_test_...` | `sk_live_...` |
| **Publishable Key** | ❌ Not required | ❌ Not required |
| **Webhook Secret** | From test webhook | From live webhook |
| **Charges** | No real charges | Real charges |
| **Test Cards** | Use test cards | Real cards only |
| **Dashboard** | `dashboard.stripe.com/test/...` | `dashboard.stripe.com/...` |

---

_Last updated: January 29, 2025_

