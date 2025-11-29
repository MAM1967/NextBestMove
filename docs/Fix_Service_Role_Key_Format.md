# Fix Service Role Key Format for Account Deletion

**Issue:** Account deletion fails with error: "Invalid service role key format"

**Root Cause:** The `SUPABASE_SERVICE_ROLE_KEY` in Vercel is not in JWT format (must start with `eyJ`)

---

## Quick Fix

### Step 1: Get the Correct Service Role Key

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Select your project
3. Go to **Settings → API**
4. Scroll to **Project API keys**
5. Find **`service_role`** key (it's labeled as "secret" - be careful!)
6. Click **"Reveal"** or **"Copy"**
7. **Verify it starts with `eyJ`** (JWT format)

### Step 2: Update in Vercel

1. Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Find `SUPABASE_SERVICE_ROLE_KEY`
3. Click **Edit**
4. **Paste the full key** (should start with `eyJ...`)
5. Make sure there are:
   - ✅ No extra spaces at the start or end
   - ✅ No quotes around the value
   - ✅ The full key (usually 300+ characters)
6. **Save**
7. **Redeploy** (or wait for auto-redeploy)

### Step 3: Verify

1. Try account deletion again
2. Should work without the format error

---

## Key Format Requirements

**✅ Correct Format (JWT):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpbGhxaGJib3Vna2Jsem5zcG93Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDEzNzM4MiwiZXhwIjoyMDc5NzEzMzgyfQ.ibcozy3GUZI4-9nDn0QgS03Qa93H5YD_6CnA8eXRNN0
```

**❌ Wrong Format (sb_secret_):**
```
sb_secret_abc123...
```

**Note:** Some newer Supabase projects may show `sb_secret_` format, but the JS client requires JWT format. You can find the JWT format key in the same Supabase Dashboard location.

---

## Why This Matters

The account deletion feature needs the service role key to:
- Bypass Row Level Security (RLS)
- Delete the user from `auth.users` (Supabase Auth)
- This requires admin privileges that only the service role key provides

---

## Troubleshooting

### Still Getting Format Error?

1. **Check the key in Vercel:**
   - Go to Environment Variables
   - Click on `SUPABASE_SERVICE_ROLE_KEY`
   - Verify it starts with `eyJ`
   - Check for hidden characters (copy/paste into a text editor)

2. **Check Supabase Dashboard:**
   - Make sure you're copying the **`service_role`** key (not `anon` key)
   - It should be labeled as "secret"
   - It should be a long JWT token (300+ characters)

3. **Redeploy:**
   - After updating the variable, Vercel should auto-redeploy
   - Or manually trigger a redeploy

4. **Check Vercel Logs:**
   - Go to Functions → `/api/users/delete-account`
   - Look for the format check logs
   - Should show: `"Starts with eyJ (JWT): true"`

---

_Last updated: January 29, 2025_

