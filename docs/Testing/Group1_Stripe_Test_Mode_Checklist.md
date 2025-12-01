# Stripe Test Mode - Billing Portal Checklist

## Issue: Billing Portal Not Opening for Past Due User

### Prerequisites for Billing Portal

1. **Customer Must Exist in Stripe**
   - Customer ID: `cus_TVHkCwhhvp35yI`
   - Must exist in your **test mode** Stripe account
   - Check: Stripe Dashboard → Customers → Search for `cus_TVHkCwhhvp35yI`

2. **Billing Portal Must Be Configured**
   - Go to: Stripe Dashboard → Settings → Billing → Customer portal
   - Must be enabled
   - Return URL should be set (or will use the one from API call)

3. **Stripe API Key Must Match**
   - `STRIPE_SECRET_KEY` in Vercel must be from **test mode** (starts with `sk_test_`)
   - If using production key (`sk_live_`), it won't find test customers

## Quick Diagnostic Steps

### Step 1: Verify Customer Exists in Test Mode

1. Go to Stripe Dashboard
2. Make sure you're in **Test mode** (toggle in top right)
3. Navigate to: Customers
4. Search for: `cus_TVHkCwhhvp35yI`
5. ✅ If found: Customer exists, proceed to Step 2
6. ❌ If not found: Customer doesn't exist, need to create it

### Step 2: Verify Billing Portal Configuration

1. In Stripe Dashboard (Test mode)
2. Go to: Settings → Billing → Customer portal
3. Check:
   - ✅ Portal is enabled
   - ✅ Business information is set
   - ✅ Return URL is configured (or will use API default)

### Step 3: Verify API Key

Check Vercel environment variables:
- `STRIPE_SECRET_KEY` should start with `sk_test_` (not `sk_live_`)

## Common Issues

### Issue 1: Customer Doesn't Exist
**Symptom:** Error: "No such customer: cus_xxxxx"

**Solution:**
- Customer was created in production mode but you're using test mode
- OR customer was deleted
- **Fix:** Create customer via checkout flow in test mode, or use a different test customer ID

### Issue 2: Wrong Stripe Account
**Symptom:** Error: "No such customer" or authentication errors

**Solution:**
- Customer exists in different Stripe account
- **Fix:** Verify you're using the correct Stripe account's API keys

### Issue 3: Billing Portal Not Configured
**Symptom:** Error: "Billing portal not configured" or similar

**Solution:**
- Enable billing portal in Stripe Dashboard
- **Fix:** Go to Settings → Billing → Customer portal → Enable

## Testing Without Real Customer

If you want to test the paywall UI without a real Stripe customer:

1. **Option A: Mock the Portal Response**
   - Temporarily modify the API to return a test URL
   - Not recommended for production testing

2. **Option B: Create Test Customer**
   - Go through checkout flow in test mode
   - This creates a real test customer
   - Then set status to `past_due` for testing

3. **Option C: Use Existing Test Customer**
   - Find a test customer in Stripe Dashboard
   - Update database to use that customer ID:
   ```sql
   UPDATE billing_customers 
   SET stripe_customer_id = 'cus_test_xxxxx'  -- Replace with real test customer ID
   WHERE user_id = 'YOUR_USER_ID';
   ```

## Next Steps

1. Check Stripe Dashboard (Test mode) for customer `cus_TVHkCwhhvp35yI`
2. Verify billing portal is enabled
3. Check browser console for specific error message
4. Check Vercel logs for detailed error

Once you have the specific error message, we can fix it!

