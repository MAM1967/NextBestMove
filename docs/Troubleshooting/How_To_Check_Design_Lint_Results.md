# How to Check Design Lint Results from Staging

**Quick Guide:** Verify design-lint is running and check its output in Vercel builds

---

## What is @lapidist/design-lint?

**Design-lint** is a tool that enforces design system consistency by:

1. **Validating Design Tokens:**
   - Checks that colors match your design system (e.g., `#2563EB` for primary blue)
   - Verifies spacing uses your base unit system (4px increments)
   - Ensures typography follows your font size/weight specifications
   - Validates border radius values

2. **Preventing Design Drift:**
   - Catches arbitrary Tailwind classes (e.g., `text-zinc-600` instead of design tokens)
   - Flags hardcoded colors that don't match your palette
   - Ensures spacing follows your 4px base unit system

3. **Current Status:**
   - **Config:** Minimal (testing mode) - all files pass
   - **Mode:** Warning only (won't block builds)
   - **Files Checked:** 224 TypeScript/React files

---

## How to Check Results in Vercel Staging Builds

### Method 1: Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard:**
   - Navigate to: https://vercel.com/dashboard
   - Select your project

2. **View Latest Deployment:**
   - Click **Deployments** tab
   - Click on the **latest deployment** (should be from staging branch)

3. **Check Build Logs:**
   - Click **Build Logs** tab (or scroll down to build output)
   - Look for the design lint section:

   ```
   📋 Step 2/5: Running design lint (staging testing)...
   > design-lint 'src/**/*.{ts,tsx}'
   
   [OK] src/middleware.ts
   [OK] src/app/layout.tsx
   [OK] src/app/page.tsx
   ...
   Linted 224 files in 0.26s
   ✅ Design lint complete
   ```

4. **What to Look For:**
   - ✅ **Success:** All files show `[OK]` - no violations found
   - ⚠️ **Warnings:** Files with design token violations (would show warnings)
   - ❌ **Errors:** Would block build if configured (currently in warn mode)

### Method 2: Check Build Output for Errors

In the same build logs, look for:

**If Working Correctly:**
```
Running design lint...
> design-lint 'src/**/*.{ts,tsx}'
[OK] src/...
Linted 224 files in 0.26s
✅ Design lint complete
```

**If There Are Issues:**
```
Running design lint...
> design-lint 'src/**/*.{ts,tsx}'
[WARN] src/app/some-file.tsx
  5:12  warning  Color #FF0000 is not in design tokens
  10:5   warning  Spacing 13px doesn't match base unit (4px)
```

### Method 3: Check Node.js Version (Confirms Design Lint Can Run)

In the build logs, verify Node.js 24 is being used:

```
Installing dependencies...
Found '/vercel/path0/web/.nvmrc' with version <24>
Now using node v24.x.x (npm v11.x.x)
```

If you see Node.js 24, design-lint will work (requires Node >= 22).

---

## Current Configuration

### What's Being Checked (Minimal Config)

**File:** `web/designlint.config.ts`

```typescript
export default defineConfig({
  tokens: {},  // Empty - not enforcing specific tokens yet
  rules: {},   // Empty - not enforcing specific rules yet
});
```

**Result:** All files pass because we're not enforcing any rules yet (testing mode).

### Future Configuration (When Ready)

Once we configure design tokens, it will check:

- **Colors:** Only allow colors from your design system (`#2563EB`, `#10B981`, etc.)
- **Spacing:** Only allow 4px increments (4, 8, 12, 16, 24, 32, 48, 64)
- **Typography:** Only allow specified font sizes (32px, 24px, 20px, etc.)
- **Border Radius:** Only allow specified values (4px, 8px, 12px, etc.)

---

## What to Do If Design Lint Fails

### If Build Fails

1. **Check Build Logs:**
   - Look for design-lint error messages
   - Note which files have violations

2. **Run Locally:**
   ```bash
   cd web
   npm run lint:design
   ```

3. **Fix Violations:**
   - Replace arbitrary colors with design tokens
   - Fix spacing to use 4px increments
   - Update typography to match specifications

4. **Re-deploy:**
   ```bash
   ./scripts/deploy-staging.sh "Fix design lint violations"
   ```

### If Design Lint Doesn't Run

**Check:**
1. Node.js version in build logs (must be >= 22)
2. Design lint step in deployment script (`deploy-staging.sh` Step 2/5)
3. Package installed: `@lapidist/design-lint@6.0.6`

**Fix:**
- Ensure `.nvmrc` has `24` (or `22+`)
- Verify `package.json` has design-lint in `devDependencies`
- Check deployment script includes design lint step

---

## Expected Output Examples

### ✅ Successful Run (Current State)

```
📋 Step 2/5: Running design lint (staging testing)...
> design-lint 'src/**/*.{ts,tsx}'

[OK] src/middleware.ts
[OK] src/app/layout.tsx
[OK] src/app/page.tsx
...
[OK] src/app/api/leads/[id]/status/route.ts

Linted 224 files in 0.26s
✅ Design lint complete
```

### ⚠️ With Warnings (Future - When Rules Configured)

```
📋 Step 2/5: Running design lint (staging testing)...
> design-lint 'src/**/*.{ts,tsx}'

[OK] src/middleware.ts
[WARN] src/app/some-component.tsx
  15:8  warning  Color #FF0000 is not in design tokens. Use #EF4444 (error-red) instead.
  20:12 warning  Spacing 13px doesn't match base unit. Use 12px or 16px.

Linted 224 files in 0.30s
⚠️  Design lint warnings found. Continuing deployment...
✅ Design lint complete
```

---

## Quick Verification Checklist

After a staging deployment, verify:

- [ ] Build logs show "Running design lint..."
- [ ] All files show `[OK]` (or warnings if rules are configured)
- [ ] "Linted X files in Y seconds" message appears
- [ ] Build completes successfully (design lint doesn't block)
- [ ] Node.js 24.x is being used (required for design-lint)

---

## Next Steps

1. **Monitor First Few Deployments:**
   - Verify design lint runs consistently
   - Check for any unexpected errors

2. **Configure Design Tokens (Future):**
   - Add color palette from `docs/UI-UX/UI_Specifications.md`
   - Add spacing system (4px base unit)
   - Add typography specifications
   - Enable stricter rules

3. **Evaluate After Testing Period:**
   - Assess value vs. overhead
   - Decide if it should block builds (currently warn-only)
   - Consider enabling for production

---

**Last Updated:** December 9, 2025

