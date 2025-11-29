# Troubleshooting Stripe Environment Variables in Vercel

If you're getting "STRIPE_SECRET_KEY is not set" error after adding it to Vercel, try these steps:

---

## 1. Verify Variable Name (Exact Match)

The variable name must be **exactly** `STRIPE_SECRET_KEY` (case-sensitive, no spaces).

**Check in Vercel:**
1. Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Look for `STRIPE_SECRET_KEY` (exact spelling)
3. Make sure there are no typos like:
   - ❌ `STRIPE_SECRET_KEY ` (trailing space)
   - ❌ `STRIPE_SECRET_KEY` (extra characters)
   - ❌ `stripe_secret_key` (wrong case)

---

## 2. Verify Environment Selection

The variable must be set for **Production** environment (or "All Environments").

**In Vercel:**
- When adding/editing the variable, check the "Environment" dropdown
- Select: **Production** (or "All Environments")
- If you only set it for "Development" or "Preview", it won't work in production

---

## 3. Verify Value Format

The value should:
- Start with `sk_test_...` (for test mode)
- Be the full key (no truncation)
- Have no extra spaces or newlines

**Common issues:**
- ❌ Copying only part of the key
- ❌ Including quotes around the value (don't add quotes)
- ❌ Extra whitespace at the start/end

---

## 4. Force Redeploy

After adding/updating environment variables:

1. **Option A: Automatic Redeploy**
   - Vercel should auto-redeploy, but wait a few minutes

2. **Option B: Manual Redeploy**
   - Go to: **Vercel Dashboard → Your Project → Deployments**
   - Click the "..." menu on the latest deployment
   - Click "Redeploy"
   - Or push a new commit to trigger deployment

---

## 5. Check Vercel Function Logs

If still not working, check the logs:

1. Go to: **Vercel Dashboard → Your Project → Functions**
2. Find: `/api/billing/create-checkout-session`
3. Check recent invocations for errors
4. Look for the exact error message

---

## 6. Verify All Required Variables

Make sure you have **all** of these set in Vercel (Production):

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_STANDARD_MONTHLY=price_...
STRIPE_PRICE_ID_STANDARD_YEARLY=price_...
STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_ID_PROFESSIONAL_YEARLY=price_...
```

---

## 7. Test Locally First

To verify your `.env.local` is correct:

1. Make sure `.env.local` has:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   ```
2. Restart your dev server: `npm run dev`
3. Test checkout locally
4. If it works locally but not in Vercel, it's a Vercel configuration issue

---

## 8. Common Mistakes

- ✅ Variable name: `STRIPE_SECRET_KEY`
- ✅ Environment: Production (or All)
- ✅ Value: Full key starting with `sk_test_...`
- ✅ No quotes around value
- ✅ No trailing spaces
- ✅ Redeployed after adding

---

## Still Not Working?

If you've verified all of the above:

1. **Double-check Vercel dashboard:**
   - Go to Settings → Environment Variables
   - Confirm `STRIPE_SECRET_KEY` is listed
   - Confirm it's set for Production
   - Click on it to verify the value (first few chars should be `sk_test_`)

2. **Check for multiple projects:**
   - Make sure you're editing the correct Vercel project
   - Verify the project is linked to the correct GitHub repo

3. **Try deleting and re-adding:**
   - Delete the variable in Vercel
   - Add it again fresh
   - Redeploy

---

_Last updated: January 29, 2025_

