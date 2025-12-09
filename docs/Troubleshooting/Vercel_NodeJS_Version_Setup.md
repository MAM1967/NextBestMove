# Vercel Node.js Version Setup

**Date:** December 9, 2025  
**Purpose:** Configure Node.js 24.x for Vercel builds (requires >= 22 for design-lint)

---

## Configuration Methods

Vercel automatically detects Node.js version using these methods (in order of priority):

1. **`.nvmrc` file** (highest priority) ✅ **Created**
2. **`package.json` `engines` field** ✅ **Configured**
3. **Vercel Dashboard settings** (manual override)

---

## Files Created/Updated

### ✅ `.nvmrc` File

**Location:** `/web/.nvmrc`  
**Content:**

```
22
```

### ✅ `package.json` Engines

**Location:** `/web/package.json`  
**Added:**

```json
"engines": {
  "node": "22.x",
  "npm": ">=10.0.0"
}
```

---

## Vercel Dashboard Settings (Note)

**Important:** Vercel automatically detects Node.js version from `.nvmrc` and `package.json` engines. The manual Node.js version selector may not appear in the Vercel dashboard UI if automatic detection is working.

If you need to manually override (rare), you can use Vercel CLI:

```bash
vercel env add NODE_VERSION production
# Enter: 22

vercel env add NODE_VERSION preview
# Enter: 22
```

However, **this is usually not necessary** as Vercel will automatically detect from `.nvmrc` and `package.json` engines.

---

## Verification

### Check Build Logs

After deploying, check the build logs:

1. Go to **Vercel Dashboard** → **Deployments**
2. Click on the latest deployment
3. Check **Build Logs** tab
4. Look for line like:
   ```
   Now using node v22.x.x
   ```

### Verify in Package.json

```bash
cd web
cat package.json | grep -A 3 '"engines"'
```

Should show:

```json
"engines": {
  "node": "22.x",
  "npm": ">=10.0.0"
}
```

### Verify .nvmrc File

```bash
cd web
cat .nvmrc
```

Should show: `22`

---

## Troubleshooting

### If Node.js Version Doesn't Change

1. **Clear Build Cache:**

   - Vercel Dashboard → Settings → Build & Deployment
   - Scroll to bottom → **Clear Build Cache**
   - Redeploy

2. **Force Redeploy:**

   - Go to Deployments
   - Click **⋯** (three dots) on latest deployment
   - Select **Redeploy**

3. **Check Build Command:**

   - Ensure no custom build command is overriding Node version
   - Settings → Build & Deployment → Build Command

4. **Verify Files Are Committed:**
   ```bash
   git status
   # Ensure .nvmrc and package.json changes are committed
   git add web/.nvmrc web/package.json
   git commit -m "Configure Node.js 22 for Vercel"
   git push
   ```

---

## Why Node.js 24?

- **Required minimum:** Node.js >= 22 for `@lapidist/design-lint@6.0.6`
- **Previously used:** Node.js 24.x (restored to maintain consistency)
- **Design Linting:** Enabled in staging deployment workflow
- **Compatibility:** All dependencies tested and compatible with Node 24

---

## Related Documentation

- [Vercel Node.js Documentation](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js)
- [Design Lint Setup](../Planning/Lapidist_Design_Lint_Setup.md)

---

**Last Updated:** December 9, 2025
