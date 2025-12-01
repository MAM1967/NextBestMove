# Enable Stripe Billing Portal for Test Mode

## Issue
Customer exists in Stripe (`cus_TVHkCwhhvP35yl`) but billing portal isn't opening.

## Solution: Enable Billing Portal in Stripe Dashboard

### Steps:

1. **Go to Stripe Dashboard**
   - Make sure you're in **Test mode** (toggle in top right)

2. **Navigate to Billing Portal Settings**
   - Click: **Settings** (gear icon in left sidebar)
   - Click: **Billing** → **Customer portal**

3. **Enable Customer Portal**
   - Toggle **"Enable customer portal"** to ON
   - Configure settings:
     - **Business information**: Add your business name/email (required)
     - **Return URL**: Can leave default or set to `https://nextbestmove.app/app/settings`
     - **Features**: Enable what customers can do:
       - ✅ Update payment methods
       - ✅ View invoices
       - ✅ Cancel subscriptions (optional)
       - ✅ Update billing information

4. **Save Changes**
   - Click **"Save"** at the bottom

5. **Test Again**
   - Go back to your app
   - Click "Update Payment Method" in the paywall
   - Should now open Stripe billing portal

## Alternative: Check API Error

If portal is already enabled, check the actual error:

1. **Browser Console** (F12):
   - Look for: `[Paywall Analytics] Billing portal error`
   - Check the error details

2. **Vercel Logs**:
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for: "Error creating customer portal session"
   - Check the error message, type, and code

## Common Errors

### Error: "Billing portal not configured"
- **Fix**: Enable billing portal in Stripe Dashboard (steps above)

### Error: "No such customer"
- **Fix**: Verify customer ID matches exactly (case-sensitive)
- Your customer ID: `cus_TVHkCwhhvP35yl`
- Database might have: `cus_TVHkCwhhvp35yI` (different case?)

### Error: "Invalid API key"
- **Fix**: Verify `STRIPE_SECRET_KEY` in Vercel is test key (`sk_test_...`)

## Quick Test

After enabling the portal, you can test directly:

```bash
# Test the portal endpoint
curl -X POST https://nextbestmove.app/api/billing/customer-portal \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json"
```

This should return: `{"url": "https://billing.stripe.com/p/session/..."}`

