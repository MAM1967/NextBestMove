# Disable Vercel Password Protection

**Issue:** Vercel's built-in password protection is intercepting requests before our Basic Auth middleware can run.

**Solution:** Disable Vercel's password protection in the dashboard.

---

## Steps to Disable Vercel Password Protection

1. **Go to Vercel Dashboard:**

   - Navigate to your project: `NextBestMove` (or `nextbestmoveapp`)
   - Click on **Settings** (in the top navigation)

2. **Find Deployment Protection:**

   - In the left sidebar, click on **Deployment Protection**
   - Or search for "Deployment Protection" in settings

3. **Disable Password Protection:**

   - Look for **"Password Protection"** or **"Vercel Authentication"**
   - If enabled, you'll see a toggle or button to disable it
   - **Disable it for Preview deployments** (staging branch)
   - Keep it disabled for Production if you want (or enable it separately)

4. **Alternative Location:**

   - Sometimes it's under **Settings → General → Deployment Protection**
   - Or **Settings → Security → Deployment Protection**

5. **Verify:**
   - After disabling, visit `https://staging.nextbestmove.app`
   - You should now see our Basic Auth prompt (if `STAGING_USER` and `STAGING_PASS` are set)
   - Or you'll see the site directly (if env vars aren't set yet)

---

## What to Look For

The Vercel password protection screen typically shows:

- "Log in to Vercel" (which is what you're seeing)
- Options to "Continue with Email", "Continue with Google", etc.
- This is Vercel's own authentication, not our Basic Auth

Once disabled, our middleware's Basic Auth will take over.

---

## Note

If you can't find the Deployment Protection settings:

- It might be a Vercel Pro feature
- Check if you're on the correct project
- Try looking in the deployment-specific settings (click on a specific deployment)

---

**After disabling, our Basic Auth middleware will handle authentication!**
