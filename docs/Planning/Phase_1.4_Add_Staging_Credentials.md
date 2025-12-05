# Add Staging Basic Auth Credentials to Vercel

**Current Status:** Basic Auth middleware is working, but credentials aren't configured yet.

**What you're seeing:** Site loads without authentication (expected - middleware skips Basic Auth if credentials aren't set)

---

## Steps to Enable Basic Auth

### Step 1: Add Environment Variables to Vercel

1. **Go to Vercel Dashboard:**
   - Navigate to your project
   - Click **Settings** (top navigation)

2. **Open Environment Variables:**
   - Click **Environment Variables** in the left sidebar
   - Or go to: Settings → Environment Variables

3. **Add `STAGING_USER`:**
   - Click **Add New**
   - **Key:** `STAGING_USER`
   - **Value:** `staging` (or your preferred username)
   - **Environment:** Select **Preview** only (NOT Production)
   - Click **Save**

4. **Add `STAGING_PASS`:**
   - Click **Add New** again
   - **Key:** `STAGING_PASS`
   - **Value:** `[choose-a-strong-password]` (e.g., `Staging2025!Secure`)
   - **Environment:** Select **Preview** only (NOT Production)
   - Click **Save**

### Step 2: Redeploy Staging

After adding the environment variables, you need to trigger a new deployment:

**Option A: Push a commit (recommended)**
```bash
git commit --allow-empty -m "chore: trigger staging deployment for Basic Auth"
git push origin staging
```

**Option B: Manual redeploy in Vercel**
- Go to Vercel Dashboard → Deployments
- Find the latest staging deployment
- Click the three dots (⋯) → **Redeploy**

### Step 3: Test Basic Auth

1. **Open staging in incognito/private window:**
   - Visit: `https://staging.nextbestmove.app`
   - You should see a browser authentication prompt

2. **Enter credentials:**
   - Username: `staging` (or whatever you set for `STAGING_USER`)
   - Password: `[your STAGING_PASS value]`
   - Click OK/Login

3. **Verify:**
   - Site should load successfully
   - You should be able to navigate the site
   - API routes should work without Basic Auth (test webhooks if needed)

---

## Troubleshooting

### Issue: Still no Basic Auth prompt after redeploy
**Check:**
- Environment variables are set to **Preview** scope (not Production)
- Deployment completed successfully
- Try hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Try incognito/private window

### Issue: Can't access with credentials
**Check:**
- Username/password match exactly (case-sensitive)
- No extra spaces in environment variable values
- Credentials are set correctly in Vercel

### Issue: API routes require Basic Auth
**This shouldn't happen** - API routes are excluded. If it does:
- Check middleware code (should skip `/api/*` routes)
- Verify the route starts with `/api/`

---

## Security Notes

- **Use a strong password** for `STAGING_PASS`
- **Don't commit credentials** to git (they're in Vercel only)
- **Share credentials securely** with team members (use a password manager)
- **Preview scope only** - these credentials won't affect production

---

## Expected Behavior After Setup

✅ **With credentials set:**
- Browser prompts for username/password
- Correct credentials → site loads
- Wrong credentials → 401 error
- API routes work without Basic Auth

✅ **Without credentials (current state):**
- Site loads directly (no authentication)
- This is the current behavior you're seeing

---

**Once you add the environment variables and redeploy, Basic Auth will be active!**

