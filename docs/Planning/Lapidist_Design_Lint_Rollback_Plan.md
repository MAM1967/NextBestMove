# Design Lint Rollback Plan

**Last Updated:** December 9, 2025  
**Purpose:** Quick rollback procedures if design linting causes issues in staging

---

## Rollback Triggers

Execute rollback if any of the following occur:

- ❌ Build fails due to design linting errors
- ❌ Excessive false positives block legitimate code
- ❌ Performance degradation in build process
- ❌ Node.js version conflicts break other tools
- ❌ Integration issues with ESLint or other tooling
- ❌ Vercel build environment incompatibilities

---

## Quick Rollback Steps

### Option 1: Disable Design Linting (Fastest)

**Remove from Build Process:**

1. Edit `web/package.json`:
   ```json
   {
     "scripts": {
       // Remove or comment out:
       // "lint:design": "design-lint 'src/**/*.{ts,tsx}'"
     }
   }
   ```

2. Commit and push:
   ```bash
   git add web/package.json
   git commit -m "Disable design linting - rollback"
   git push origin staging
   ```

**Result:** Linting won't run, but package stays installed for future use.

---

### Option 2: Revert Git Commit

**If design linting was added in a single commit:**

```bash
# Find the commit that added design linting
git log --oneline --grep="design-lint" --grep="lapidist"

# Revert the commit
git revert <commit-hash>

# Push to staging
git push origin staging
```

**Result:** Reverts all changes related to design linting.

---

### Option 3: Vercel Dashboard Rollback

**Promote Previous Deployment:**

1. Go to Vercel dashboard
2. Navigate to your project
3. Click "Deployments" tab
4. Find the deployment **before** design linting was added
5. Click "..." menu → "Promote to Production" (or "Redeploy" for preview)
6. Select "staging" environment if prompted

**Result:** Staging site reverts to previous working state.

---

### Option 4: Uninstall Package

**Remove Package Completely:**

```bash
cd web
npm uninstall @lapidist/design-lint
rm designlint.config.json  # If exists
git add package.json package-lock.json
git commit -m "Remove design linting package"
git push origin staging
```

**Result:** Package and configuration removed.

---

### Option 5: Revert Node.js Version (If Upgraded)

**If Node.js was upgraded for design linting:**

**Vercel:**
1. Go to Vercel dashboard → Project Settings → General
2. Change "Node.js Version" back to previous version (e.g., 20.x)
3. Save changes
4. Trigger new deployment

**Local (if needed):**
```bash
nvm use 20  # Or previous version
```

**Result:** Reverts Node.js version change.

---

## Testing After Rollback

After executing rollback:

1. ✅ Verify staging site builds successfully
2. ✅ Verify staging site loads and functions correctly
3. ✅ Check build logs for errors
4. ✅ Test critical user flows
5. ✅ Document what went wrong (for future reference)

---

## Prevention: Safe Deployment Strategy

To minimize risk, deploy in this order:

1. **Install package only** (don't run in build yet)
   ```bash
   npm install --save-dev @lapidist/design-lint
   git commit -m "Add design lint package (not enabled)"
   git push origin staging
   ```

2. **Verify staging still works** (package installed but not used)

3. **Add configuration file** (still don't run in build)
   ```bash
   # Add designlint.config.json
   git commit -m "Add design lint config (not enabled)"
   git push origin staging
   ```

4. **Add script but don't fail build** (warnings only)
   ```bash
   # In package.json:
   "lint:design": "design-lint 'src/**/*.{ts,tsx}' || true"
   ```

5. **Test manually** on staging
   ```bash
   npm run lint:design
   ```

6. **Enable in build process** (after manual testing)
   ```bash
   # Update build script to include lint:design
   ```

This incremental approach allows testing at each step.

---

## Emergency Contacts

- **Vercel Support:** If dashboard rollback doesn't work
- **Documentation:** See `docs/Planning/Lapidist_Design_Lint_Setup.md`

---

**Status:** Ready for use if rollback needed

