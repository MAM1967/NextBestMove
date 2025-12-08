# Manual Fix for Staging Cron Jobs - Authorization Headers

## Problem
Cron jobs are returning `{"error":"Unauthorized"}` because they need Authorization headers instead of query parameters.

## Solution
Manually update each job in cron-job.org to add the Authorization header.

---

## Step-by-Step Instructions

### For Each of the 5 Failing Jobs:

1. **[STAGING] Daily Plans**
2. **[STAGING] Payment Failure Recovery**
3. **[STAGING] Streak Recovery**
4. **[STAGING] Win-Back Campaign**
5. **[STAGING] Morning Plan Email**

---

### Steps for Each Job:

1. **Go to cron-job.org:**
   - Log in to your account
   - Navigate to **Cron Jobs** → Find the job (e.g., "[STAGING] Daily Plans")
   - Click **EDIT** (pencil icon)

2. **Update the URL:**
   - **Remove** the `?secret=...` query parameter from the URL
   - **Before:** `https://staging.nextbestmove.app/api/cron/daily-plans?secret=e6720e0c094fd8ba7494b27073d03c6405d9422bdc1e0af0a7e16f678f55ec83`
   - **After:** `https://staging.nextbestmove.app/api/cron/daily-plans`

3. **Add Authorization Header:**
   - Look for **"Request Headers"** or **"Custom Headers"** section
   - Click **"Add Header"** or **"Add Custom Header"**
   - **Header Name:** `Authorization`
   - **Header Value:** `Bearer e6720e0c094fd8ba7494b27073d03c6405d9422bdc1e0af0a7e16f678f55ec83`
   - ⚠️ **IMPORTANT:** Include the word "Bearer" followed by a space, then the secret

4. **Save the Job:**
   - Click **"Save"** or **"Update"**
   - Verify the changes are saved

5. **Test the Job:**
   - Click **"Run now"** or **"Test"** button
   - Check the execution log
   - Should see success (not "Unauthorized" error)

---

## Job-Specific URLs (without query params):

| Job Name | Clean URL |
|----------|-----------|
| [STAGING] Daily Plans | `https://staging.nextbestmove.app/api/cron/daily-plans` |
| [STAGING] Payment Failure Recovery | `https://staging.nextbestmove.app/api/cron/payment-failure-recovery` |
| [STAGING] Streak Recovery | `https://staging.nextbestmove.app/api/cron/streak-recovery` |
| [STAGING] Win-Back Campaign | `https://staging.nextbestmove.app/api/cron/win-back-campaign` |
| [STAGING] Morning Plan Email | `https://staging.nextbestmove.app/api/notifications/morning-plan` |

---

## Authorization Header Value:

```
Bearer e6720e0c094fd8ba7494b27073d03c6405d9422bdc1e0af0a7e16f678f55ec83
```

**Important Notes:**
- Must start with "Bearer " (with a space after "Bearer")
- The secret value is: `e6720e0c094fd8ba7494b27073d03c6405d9422bdc1e0af0a7e16f678f55ec83`
- No quotes needed in the header value field
- Header name is case-insensitive, but use "Authorization" (capital A)

---

## Verification Checklist:

After updating each job:

- [ ] URL no longer contains `?secret=...`
- [ ] Authorization header is added with correct value
- [ ] Job saved successfully
- [ ] "Run now" test succeeds (no "Unauthorized" error)
- [ ] Execution log shows success or expected business logic errors (not auth errors)

---

## If You Can't Find "Request Headers" Section:

Some cron-job.org interfaces may have different layouts. Look for:

- **"Advanced Settings"**
- **"Request Options"**
- **"HTTP Headers"**
- **"Custom Headers"**
- **"Additional Headers"**
- **"Headers"** tab or section

If you still can't find it, the API might not support headers via the UI. In that case, we may need to:
1. Keep using query parameters (`?secret=...`)
2. Or verify the CRON_SECRET value in Vercel matches what we're using

---

## Alternative: Verify CRON_SECRET in Vercel

If headers don't work, check that `CRON_SECRET` in Vercel (Preview scope) matches:

```
e6720e0c094fd8ba7494b27073d03c6405d9422bdc1e0af0a7e16f678f55ec83
```

If it doesn't match, update it in Vercel → Settings → Environment Variables → Preview scope.

