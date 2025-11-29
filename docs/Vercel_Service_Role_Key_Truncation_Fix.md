# Fix: Vercel Service Role Key Truncation Issue

**Problem:** Vercel is reading a truncated service role key (`sb_secret_...` with only 41 characters) instead of the full JWT key.

**Root Cause:** The environment variable in Vercel is either:
1. Set to the wrong value (short `sb_secret_` key instead of full JWT)
2. Truncated when pasting (Vercel may have character limits in the UI)
3. Set for the wrong environment (Preview instead of Production)

---

## Solution: Update the Key in Vercel

### Step 1: Get the Full JWT Key

The key you provided:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpbGhxaGJib3Vna2Jsem5zcG93Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDEzNzM4MiwiZXhwIjoyMDc5NzEzMzgyfQ.ibcozy3GUZI4-9nDn0QgS03Qa93H5YD_6CnA8eXRNN0
```

**Verify this is the complete key:**
- Should be ~300+ characters long
- Should start with `eyJ`
- Should be from Supabase Dashboard → Settings → API → `service_role` key (secret)

### Step 2: Update in Vercel

1. **Go to Vercel Dashboard:**
   - Project → Settings → Environment Variables

2. **Find `SUPABASE_SERVICE_ROLE_KEY`:**
   - Click **Edit**
   - **Delete the current value** (it's truncated/wrong)

3. **Paste the FULL key:**
   - Copy the complete JWT key from Supabase
   - Paste it into Vercel
   - **Important:** Make sure you paste the ENTIRE key (all 300+ characters)

4. **Verify Environment:**
   - Check the "Environment" dropdown
   - Select **Production** (or "All Environments")
   - Make sure it's not just set for "Preview" or "Development"

5. **Save**

### Step 3: Verify the Key Length

After saving, you can verify by:
1. Clicking on the variable again
2. The value should show the full key (you may need to click "Reveal")
3. It should start with `eyJ` and be 300+ characters

### Step 4: Redeploy

1. **Trigger a new deployment:**
   - Vercel should auto-redeploy
   - Or manually trigger: Deployments → Latest → "..." → "Redeploy"

2. **Test again:**
   - Try account deletion
   - Check Vercel logs - should show:
     - `Service role key length: 300+` (not 41)
     - `Starts with eyJ (JWT): true`

---

## Why This Happened

**Possible causes:**
1. **Wrong key format:** You may have accidentally copied the `sb_secret_` format key instead of the JWT format
2. **Truncation:** Vercel UI may have truncated the key when pasting (rare, but possible)
3. **Multiple keys:** There might be multiple environment variables, and the wrong one is being read
4. **Environment mismatch:** Key is set for Preview but not Production

---

## Verification Checklist

After updating, verify:

- [ ] Key in Vercel starts with `eyJ`
- [ ] Key length is 300+ characters (not 41)
- [ ] Key is set for **Production** environment
- [ ] Redeployed after updating
- [ ] Vercel logs show correct key length and format

---

## If Still Not Working

1. **Check Vercel logs again:**
   - Look for "Service role key length: XXX"
   - Should be 300+, not 41

2. **Try deleting and re-adding:**
   - Delete the variable completely
   - Add it again fresh
   - Paste the full key carefully

3. **Check for hidden characters:**
   - Copy the key from Supabase Dashboard
   - Paste into a text editor first
   - Verify it's the full key
   - Then copy from text editor to Vercel

---

_Last updated: January 29, 2025_

