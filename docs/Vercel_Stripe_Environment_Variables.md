# Vercel Stripe Environment Variables Setup

**Quick Reference:** Add these environment variables to Vercel for Stripe checkout to work.

---

## Required Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these for **Production** environment:

### 1. Stripe Secret Key (Test Mode)

```
STRIPE_SECRET_KEY=sk_test_...
```

**How to get it:**
1. Go to [Stripe Dashboard (Test Mode)](https://dashboard.stripe.com/test/apikeys)
2. Under "Secret key", click "Reveal test key"
3. Copy the key (starts with `sk_test_...`)
4. Paste into Vercel

### 2. Stripe Webhook Secret (Test Mode)

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

**How to get it:**
1. Go to [Stripe Dashboard (Test Mode)](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint" (or edit existing)
3. Set URL: `https://nextbestmove.app/api/billing/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. Click "Add endpoint"
6. Click on the endpoint → "Signing secret" → "Reveal"
7. Copy the secret (starts with `whsec_...`)
8. Paste into Vercel

### 3. Stripe Price IDs

You need to create Products and Prices in Stripe first, then add the Price IDs:

```
STRIPE_PRICE_ID_STANDARD_MONTHLY=price_...
STRIPE_PRICE_ID_STANDARD_YEARLY=price_...
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_ID_PREMIUM_YEARLY=price_...
```

**How to create Products and Prices:**

1. Go to [Stripe Dashboard (Test Mode)](https://dashboard.stripe.com/test/products)
2. Click "Add product"
3. Create products:
   - **Standard Plan** (Monthly): $29/month
   - **Standard Plan** (Yearly): $249/year
   - **Premium Plan** (Monthly): $79/month
   - **Premium Plan** (Yearly): $649/year
4. For each product, create a Price:
   - Click "Add price"
   - Set amount and billing period
   - Click "Add price"
5. Copy each Price ID (starts with `price_...`)
6. Add to Vercel

---

## After Adding Variables

1. **Redeploy:** Vercel will automatically redeploy, or you can trigger a manual redeploy
2. **Test:** Try the checkout flow again
3. **Verify:** Check Vercel function logs if errors persist

---

## Quick Checklist

- [ ] `STRIPE_SECRET_KEY` added (test mode: `sk_test_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` added (test mode: `whsec_...`)
- [ ] `STRIPE_PRICE_ID_STANDARD_MONTHLY` added
- [ ] `STRIPE_PRICE_ID_STANDARD_YEARLY` added
- [ ] `STRIPE_PRICE_ID_PREMIUM_MONTHLY` added
- [ ] `STRIPE_PRICE_ID_PREMIUM_YEARLY` added
- [ ] Webhook endpoint created in Stripe
- [ ] Redeployed after adding variables

---

_Last updated: January 29, 2025_

