# How to Verify Node.js 24 in Vercel Builds

**Quick Guide:** After deploying, verify Vercel is using Node.js 24

---

## Automatic Detection

Vercel automatically detects Node.js version from:
1. `.nvmrc` file (highest priority) ✅ Created: `web/.nvmrc` with `24`
2. `package.json` engines field ✅ Configured: `"node": "24.x"`

**You don't need to set it manually in the UI** - Vercel will use these files automatically.

---

## How to Verify It's Working

### Step 1: Deploy to Staging

```bash
./scripts/deploy-staging.sh "Configure Node.js 24 and design linting"
```

### Step 2: Check Build Logs

1. Go to **Vercel Dashboard**
2. Navigate to your project
3. Click **Deployments** tab
4. Click on the **latest deployment**
5. Click **Build Logs** tab (or scroll down to build output)
6. Look for these lines:

```
Installing dependencies...
Found '/vercel/path0/web/.nvmrc' with version <24>
Now using node v24.x.x (npm v11.x.x)
```

### Step 3: Verify Design Lint Runs

In the same build logs, you should see:

```
Running design lint...
> design-lint 'src/**/*.{ts,tsx}'
[OK] src/...
```

If you see this, it confirms:
- ✅ Node.js 24 is active (design-lint requires Node 22+, Node 24 works perfectly)
- ✅ Design linting is running

---

## If Node.js 22 Is Not Detected

### Check Build Logs for Errors

Look for:
- ❌ `Node.js version 20.x detected` (wrong version)
- ❌ `design-lint: command not found` (Node 22 not used)
- ❌ `AbortSignal.timeout is not a function` (Node version too old)

### Troubleshooting Steps

1. **Verify files are committed:**
   ```bash
   git log -1 --name-only | grep -E "(\.nvmrc|package\.json)"
   ```

2. **Check file contents:**
   ```bash
   cat web/.nvmrc  # Should show: 22
   cat web/package.json | grep -A 2 '"engines"'  # Should show node: "22.x"
   ```

3. **Force clear Vercel build cache:**
   - Vercel Dashboard → Settings → Build & Deployment
   - Scroll to bottom → **Clear Build Cache**
   - Redeploy

4. **Check Vercel project root:**
   - Ensure Vercel is building from `web/` directory
   - Settings → General → Root Directory
   - Should be: `web` (if your Next.js app is in `web/` folder)

---

## Expected Build Output

When working correctly, you should see in build logs:

```
# Node version detection
Found '/vercel/path0/web/.nvmrc' with version <24>
Now using node v24.x.x (npm v11.x.x)

# Design lint (if enabled in deployment script)
Running design lint...
> design-lint 'src/**/*.{ts,tsx}'
[OK] src/...
Linted 224 files in 0.30s

# Type check
Running type-check...
> tsc --noEmit
✅ Type check passed

# Build
Running "npm run build"...
> next build
...
```

---

## Quick Verification Checklist

After deploying, verify:

- [ ] Build logs show `Now using node v24.x.x`
- [ ] Build completes successfully
- [ ] Design lint runs (if enabled) without errors
- [ ] Type check passes
- [ ] Application works in preview/production

---

**Last Updated:** December 9, 2025

