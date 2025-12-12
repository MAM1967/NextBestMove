# Trigger Vercel Production Deployment

## CLI Method (Recommended)

### Install Vercel CLI (if not already installed):
```bash
npm i -g vercel
```

### Login to Vercel:
```bash
vercel login
```

### Deploy to Production:
```bash
# From project root
vercel --prod
```

This will:
- Trigger a new production build
- Use the latest code from your `main` branch
- Include all environment variables from Vercel
- Deploy to production

---

## GUI Method

1. **Go to Vercel Dashboard:**
   - Your Project → **Deployments**
   - Find the latest production deployment

2. **Redeploy:**
   - Click the "..." menu (three dots)
   - Click **"Redeploy"**
   - This should trigger a new build

**Note:** "Redeploy" in Vercel GUI DOES trigger a new build, but it uses the same commit. If you want to use the latest code, use the CLI method or push a new commit.

---

## The Real Issue

Even after redeploying, `PRODUCTION_GOOGLE_CLIENT_SECRET` isn't being passed to runtime. This is a known Vercel bug where environment variables aren't always available at runtime, even when correctly configured.

---

## Workaround Options

### Option 1: Hardcode (GitHub Will Block)
We could hardcode the production client secret in code, but GitHub's secret scanning will block the push.

### Option 2: Use Different Variable Name
Sometimes Vercel has issues with certain variable names. Try:
- `GOOGLE_CLIENT_SECRET_PRODUCTION` instead of `PRODUCTION_GOOGLE_CLIENT_SECRET`

### Option 3: Use Next.js Runtime Config
We could use Next.js's `publicRuntimeConfig` or `serverRuntimeConfig`, but this has limitations.

### Option 4: Accept GitHub Secret Scanning Override
When GitHub blocks the push, you can click the link in the error to allow the secret. This is a one-time override.

---

## Recommended Next Steps

1. **Try CLI deployment:**
   ```bash
   vercel --prod
   ```

2. **If still not working, try renaming the variable:**
   - Delete `PRODUCTION_GOOGLE_CLIENT_SECRET`
   - Add `GOOGLE_CLIENT_SECRET_PRODUCTION` instead
   - Update code to use the new name
   - Redeploy

3. **If still not working, hardcode it:**
   - We'll need to allow GitHub's secret scanning override
   - Or use a different approach

Let me know which approach you'd like to try!


