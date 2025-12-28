# Verify SUPABASE_SERVICE_ROLE_KEY in Vercel

## Correct Staging Service Role Key

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2lwdHpieG56ZGRiZ2ZldXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg3OTQzMiwiZXhwIjoyMDgwNDU1NDMyfQ.-JUP_rXGxxxyv6Rk0ThtCZYZou_d33zuGJU33xy6eoo
```

**Verification:**
- ✅ Starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
- ✅ Contains `adgiptzbxnzddbgfeuut` (staging project ID)
- ✅ Contains `service_role` (correct role)
- ✅ Length: 219 characters

---

## Steps to Set in Vercel

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select project: **NextBestMove**

2. **Navigate to Environment Variables:**
   - Click **Settings** → **Environment Variables**

3. **Filter by Preview:**
   - Click the **Preview** button to filter (important!)

4. **Find or Add `SUPABASE_SERVICE_ROLE_KEY`:**
   - If it exists: Click **Edit** (three dots menu)
   - If it doesn't exist: Click **Add New**

5. **Set the Value:**
   - **Key:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Paste the key above (entire string, no spaces)
   - **Environment:** Select **Preview** only
   - Click **Save**

6. **Verify:**
   - The key should be visible in the Preview scope list
   - Value should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
   - Should be ~219 characters long

7. **Redeploy Staging:**
   - Go to **Deployments**
   - Find latest staging deployment
   - Click **Redeploy** (three dots menu)
   - Wait for completion

8. **Test Cron Job:**
   - Go to cron-job.org
   - Run "[STAGING] Daily Plans" job
   - Should succeed (no "Invalid API key" error)

---

## Common Issues

### Issue: Key Not Visible After Adding
**Fix:** Make sure you filtered by **Preview** scope. Production scope variables won't show up.

### Issue: Still Getting "Invalid API key" After Update
**Fix:** 
1. Ensure you **redeployed** staging after updating the variable
2. Check that the key has no leading/trailing spaces
3. Verify the key is in **Preview** scope, not Production

### Issue: Key Truncated
**Fix:** Copy the entire key from Supabase (click "Copy" button, don't manually select)

---

## Quick Test

After setting and redeploying, test the endpoint:

```bash
curl -X GET \
  -H "Authorization: Bearer e6720e0c094fd8ba7494b27073d03c6405d9422bdc1e0af0a7e16f678f55ec83" \
  "https://staging.nextbestmove.app/api/cron/daily-plans"
```

**Expected:** Success response (not "Invalid API key")










