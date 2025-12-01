# Stripe Billing Portal Troubleshooting

## Error: "An error occurred with our connection to Stripe. Request was retried 2 times."

This error indicates that the Stripe SDK cannot connect to Stripe's API. Here's how to diagnose and fix it.

---

## Step 1: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → Functions → Logs
2. Filter for `/api/billing/customer-portal`
3. Look for the error log entry that shows:
   - `stripeApiKeyPrefix` (should start with `sk_test_` for test mode or `sk_live_` for production)
   - `customerId`
   - `type`, `code`, `statusCode` from the Stripe error
   - `rawError` details

---

## Step 2: Verify Stripe API Key

### Check Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `STRIPE_SECRET_KEY` is set
3. **Important:** Make sure you're using the **test mode** key (starts with `sk_test_`) for testing
4. The key should match the Stripe account where:
   - The customer was created
   - The billing portal is configured

### Verify Key Format

- Test mode: `sk_test_...` (51 characters)
- Live mode: `sk_live_...` (51 characters)
- **Never use:** `pk_...` (publishable keys) - these won't work for server-side API calls

---

## Step 3: Verify Customer Exists in Stripe

The enhanced error handling now verifies the customer exists before creating the portal session.

### Check Stripe Dashboard

1. Go to Stripe Dashboard → Customers
2. Search for the customer ID from your database (`billing_customers.stripe_customer_id`)
3. Verify:
   - Customer exists
   - Customer is in the **same Stripe account** as your API key
   - Customer is not deleted

### Test Customer Retrieval

You can test if the customer exists using Stripe CLI:

```bash
stripe customers retrieve <customer_id> --api-key <your_stripe_secret_key>
```

---

## Step 4: Verify Billing Portal is Enabled

The Stripe Customer Portal must be enabled in your Stripe Dashboard.

### Enable Billing Portal (Test Mode)

1. Go to Stripe Dashboard → Settings → Billing → Customer portal
2. Click "Activate test link"
3. Configure portal settings:
   - **Business information:** Add your business name and support email
   - **Features:** Enable "Update payment method" and "Cancel subscription" (if needed)
   - **Branding:** Customize colors and logo (optional)

### Verify Portal Configuration

- Portal must be activated for **test mode** (if using test API key)
- Portal must be activated for **live mode** (if using live API key)
- The portal link should be: `https://billing.stripe.com/p/login/test_...` (test mode) or `https://billing.stripe.com/p/login/...` (live mode)

---

## Step 5: Check Network/Firewall Issues

If the error persists, it might be a network issue:

1. **Vercel Function Timeout:** Check if the function is timing out (default is 10 seconds for Hobby plan)
2. **Stripe API Status:** Check https://status.stripe.com/ for any outages
3. **IP Restrictions:** If your Stripe account has IP restrictions, ensure Vercel's IPs are allowed

---

## Step 6: Test with Stripe CLI

You can test the billing portal creation directly:

```bash
stripe billing portal sessions create \
  --customer <customer_id> \
  --return-url https://nextbestmove.app/app/settings \
  --api-key <your_stripe_secret_key>
```

If this works, the issue is in the code. If it fails, the issue is with Stripe configuration.

---

## Common Issues and Solutions

### Issue 1: Wrong Stripe Account

**Symptom:** Customer exists but portal creation fails with "resource_missing" or connection error.

**Solution:** 
- Ensure the `STRIPE_SECRET_KEY` in Vercel matches the Stripe account where the customer was created
- Check that you're using test mode key for test customers, live mode key for live customers

### Issue 2: Billing Portal Not Activated

**Symptom:** Connection error or "portal not configured" error.

**Solution:**
- Activate the billing portal in Stripe Dashboard → Settings → Billing → Customer portal
- Ensure it's activated for the correct mode (test/live)

### Issue 3: Customer from Different Account

**Symptom:** Customer verification fails or customer not found.

**Solution:**
- Verify the customer ID in your database matches a customer in your Stripe Dashboard
- If using test mode, ensure the customer was created with a test mode API key

### Issue 4: API Key Format Error

**Symptom:** "Invalid API key" or connection error.

**Solution:**
- Ensure you're using the **secret key** (`sk_test_...` or `sk_live_...`), not the publishable key (`pk_...`)
- Copy the key directly from Stripe Dashboard → Developers → API keys → Secret key
- Ensure there are no extra spaces or newlines in the environment variable

---

## Enhanced Error Logging

The updated code now logs:

- `stripeApiKeyPrefix`: First 7 characters of the API key (to verify it's set, without exposing the full key)
- `customerId`: The Stripe customer ID being used
- `rawError`: Full Stripe error details including type, code, and message
- Customer verification step: Checks if customer exists before creating portal session

Check Vercel function logs for these details to diagnose the issue.

---

## Next Steps

1. Check Vercel logs for the detailed error message
2. Verify `STRIPE_SECRET_KEY` is set correctly in Vercel
3. Verify the customer exists in Stripe Dashboard
4. Verify billing portal is activated in Stripe Dashboard
5. Test with Stripe CLI to isolate the issue

If the issue persists after these checks, share the Vercel log output for further diagnosis.

