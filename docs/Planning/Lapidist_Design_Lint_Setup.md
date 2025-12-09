# @lapidist/design-lint Setup & Testing Plan

**Status:** ✅ **READY FOR TESTING** - Node.js 22 Installed  
**Last Updated:** December 9, 2025  
**Target:** Staging deployment testing (with rollback capability)

---

## Overview

This document outlines the setup and testing plan for `@lapidist/design-lint` on the staging environment. The tool will enforce design system consistency by validating design tokens, checking component usage, and preventing design drift.

---

## Current Status

### Installation Status

- ✅ Package installed: `@lapidist/design-lint@6.0.6`
- ✅ Configuration created: `web/designlint.config.ts` (TypeScript config)
- ✅ DTIF token file created: `web/design.tokens.json` (Design Token Interchange Format)
- ✅ Script added: `npm run lint:design`
- ✅ **Node.js version:** v24.11.1 (matches Vercel, design-lint compatible)
- ✅ Dependencies tested and compatible with Node.js 24
- ✅ Design-lint runs successfully with DTIF tokens configured

### Issues Identified

1. **Node.js Version Requirement**
   - `@lapidist/design-lint@6.0.6` requires Node.js >= 22
   - Current environment: Node.js v20.19.2
   - This blocks initialization and runtime execution

2. **Missing Dependencies**
   - Missing module: `ajv/dist/2020.js`
   - May be related to Node.js version incompatibility

---

## Options to Proceed

### Option 1: Upgrade Node.js (Recommended for Testing)

**Pros:**
- Meets package requirements
- Enables full functionality
- Future-proof solution

**Cons:**
- May require updating deployment environment (Vercel)
- Need to verify compatibility with other dependencies
- Could affect other tools/scripts

**Steps:**
1. Upgrade local Node.js to v22+
2. Test locally first
3. Verify Vercel build environment supports Node 22
4. Update Vercel Node.js version if needed

### Option 2: Wait for Node 20 Support (Conservative)

**Pros:**
- No environment changes needed
- Lower risk
- Wait for package update

**Cons:**
- Delays design linting implementation
- May never get Node 20 support if package moves forward

### Option 3: Use Alternative Design Linting Tool

**Pros:**
- May have better Node.js compatibility
- Explore other options

**Cons:**
- Different feature set
- Learning curve
- May not meet requirements

---

## Recommended Approach

**For Staging Testing:**
1. **Upgrade Node.js to v22+ locally** for testing
2. **Verify Vercel supports Node 22** (check Vercel settings)
3. **Update Vercel Node.js version** if needed (staging only)
4. **Install missing dependencies** and retry initialization
5. **Test locally first** before staging deployment
6. **Deploy to staging** and monitor
7. **Rollback plan ready** if issues occur

---

## Configuration Plan (Once Node.js Issue Resolved)

### 1. Initialize Configuration

```bash
cd web
npx @lapidist/design-lint init
```

This will create a `designlint.config.json` file.

### 2. Map Design System Tokens

Based on `docs/UI-UX/UI_Specifications.md`, configure:

**Colors:**
- Primary Blue: `#2563EB`
- Success Green: `#10B981`
- Warning Orange: `#F59E0B`
- Error Red: `#EF4444`
- Fast Win Accent: `#8B5CF6`
- Gray scale (9 shades)

**Spacing:**
- Base unit: 4px
- xs: 4px, sm: 8px, md: 12px, base: 16px, lg: 24px, xl: 32px, 2xl: 48px, 3xl: 64px

**Typography:**
- Font sizes: H1 (32px), H2 (24px), H3 (20px), Body (14px), etc.
- Font weights: 300, 400, 500, 600, 700

**Border Radius:**
- sm: 4px, base: 8px, md: 12px, lg: 16px, xl: 24px

### 3. Staging-Only Configuration

Create environment-based configuration:

```json
{
  "enabled": true,
  "environments": ["staging"],
  "rules": {
    // Design token validation rules
  }
}
```

### 4. Add to Build Process (Staging Only)

Update `package.json` scripts:

```json
{
  "scripts": {
    "lint:design": "design-lint 'src/**/*.{ts,tsx}'",
    "build:staging": "npm run lint:design && next build"
  }
}
```

### 5. Update Deployment Scripts

Modify `scripts/deploy-staging.sh` to include design linting:

```bash
run_design_lint() {
  echo "🎨 Running design lint..."
  cd "$WEB_DIR"
  if ! npm run lint:design; then
    echo "⚠️  Design lint warnings found. Continuing deployment..."
    # Don't fail build, just warn
  fi
  cd ..
  echo "✅ Design lint complete."
}
```

---

## Rollback Plan

### If Design Linting Breaks Staging Build

**Quick Rollback Steps:**

1. **Remove from Build Process:**
   ```bash
   # Remove lint:design from build script
   # Or set environment variable to disable
   ```

2. **Revert Git Commit:**
   ```bash
   git revert <commit-hash>
   git push origin staging
   ```

3. **Vercel Dashboard Rollback:**
   - Go to Vercel dashboard
   - Navigate to Deployments
   - Promote previous deployment to staging

4. **Uninstall Package (if needed):**
   ```bash
   npm uninstall @lapidist/design-lint
   ```

### Rollback Triggers

Rollback if:
- Build fails due to linting errors
- False positives block legitimate code
- Performance degradation
- Integration issues with existing tools
- Node.js version conflicts in production

---

## Testing Plan

### Phase 1: Local Testing (Before Staging)

- [x] Upgrade Node.js to v22+ locally
- [x] Install missing dependencies
- [x] Initialize design-lint configuration
- [x] Map design system tokens ✅ **COMPLETED**
- [x] Run linting on existing codebase (minimal config works)
- [ ] Review and fix linting errors (now that tokens are configured)
- [x] Verify no build issues (minimal config passes)

### Phase 2: Staging Deployment

- [ ] Deploy to staging with design linting enabled
- [ ] Monitor build process
- [ ] Verify staging site works correctly
- [ ] Check for any runtime issues
- [ ] Review linting output/errors
- [ ] Test key user flows

### Phase 3: Evaluation Period (48 Hours)

- [ ] Monitor staging for 48 hours
- [ ] Document any issues
- [ ] Collect feedback on linting output
- [ ] Assess value vs. overhead

### Phase 4: Decision Point

**If Successful:**
- [ ] Apply to production
- [ ] Integrate into CI/CD pipeline
- [ ] Document best practices

**If Issues Found:**
- [ ] Execute rollback plan
- [ ] Document learnings
- [ ] Consider alternatives

---

## Node.js Version Upgrade Steps

### Local Development

1. **Install Node.js 22+ (via nvm):**
   ```bash
   nvm install 22
   nvm use 22
   ```

2. **Verify version:**
   ```bash
   node --version  # Should show v22.x.x
   ```

3. **Reinstall dependencies:**
   ```bash
   cd web
   rm -rf node_modules package-lock.json
   npm install
   ```

### Vercel Environment

**Note:** Vercel automatically detects Node.js version from `.nvmrc` and `package.json` engines. The manual UI selector may not appear if auto-detection is enabled.

1. **Configuration files created:**
   - ✅ `.nvmrc` file with `22`
   - ✅ `package.json` engines field: `"node": "22.x"`

2. **Verify in build logs (after deployment):**
   - Go to Vercel Dashboard → Deployments → Latest deployment
   - Check Build Logs tab
   - Look for: `Now using node v22.x.x`
   - This confirms Vercel detected and used Node.js 22

---

## Configuration Example

Once Node.js is upgraded, create `designlint.config.json`:

```json
{
  "$schema": "https://design-lint.lapidist.net/schema.json",
  "version": "1.0",
  "rules": {
    "color": {
      "allowed": [
        "#2563EB", // Primary Blue
        "#1D4ED8", // Primary Blue Hover
        "#10B981", // Success Green
        "#F59E0B", // Warning Orange
        "#EF4444", // Error Red
        "#8B5CF6", // Fast Win Accent
        // ... other colors from UI spec
      ],
      "disallowed": [
        // Arbitrary Tailwind colors like zinc-50, blue-500, etc.
      ]
    },
    "spacing": {
      "baseUnit": 4,
      "allowed": [4, 8, 12, 16, 24, 32, 48, 64]
    },
    "typography": {
      "fontSizes": {
        "allowed": ["2rem", "1.5rem", "1.25rem", "1rem", "0.875rem", "0.75rem"]
      },
      "fontWeights": {
        "allowed": [300, 400, 500, 600, 700]
      }
    }
  },
  "ignore": [
    "node_modules/**",
    ".next/**",
    "dist/**",
    "build/**"
  ]
}
```

---

## Next Steps

### Immediate Actions

1. **Decide on Node.js upgrade approach**
   - ✅ **Recommended:** Upgrade to Node 22 for staging testing
   - ⚠️ **Alternative:** Wait for Node 20 support (may delay implementation)
   - ⚠️ **Alternative:** Use alternative design linting tool

2. **If upgrading Node.js (Recommended):**
   
   **Local Development:**
   ```bash
   # Install Node.js 22 via nvm (if available)
   nvm install 22
   nvm use 22
   
   # Or download from nodejs.org
   # Then verify:
   node --version  # Should show v22.x.x
   
   # Reinstall dependencies
   cd web
   rm -rf node_modules package-lock.json
   npm install
   ```
   
   **Vercel Staging Environment:**
   - Go to Vercel dashboard → Project Settings → General
   - Find "Node.js Version" setting
   - Change to Node.js 22.x (or latest)
   - Save changes
   - This applies to staging/preview deployments
   
   **After Node.js Upgrade:**
   ```bash
   # Verify design-lint works
   cd web
   npm run lint:design
   
   # Review configuration
   # Edit designlint.config.json as needed
   ```

3. **Test on Staging:**
   - Deploy to staging after Node.js upgrade
   - Monitor build logs
   - Verify linting runs during build
   - Test staging site functionality
   - Review linting output

4. **Rollback Ready:**
   - Document current Node.js version
   - Have rollback steps ready (see Rollback Plan section)
   - Can revert Vercel Node.js version if needed

---

## Resources

- [@lapidist/design-lint Documentation](https://design-lint.lapidist.net/)
- [Design System: docs/UI-UX/UI_Specifications.md](../UI-UX/UI_Specifications.md)
- [Vercel Node.js Version Settings](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js)

---

**Status:** ✅ **TOKENS CONFIGURED** - Ready for Staging Testing

**Current Configuration:**
- ✅ Design tokens defined in DTIF format (`web/design.tokens.json`)
- ✅ Config file (`web/designlint.config.ts`) imports DTIF tokens
- ✅ Colors, spacing, typography, border radius, shadows configured
- ✅ Rules enabled in warn mode (can escalate to error later)
- ✅ Running in Vercel builds (Node.js 24.x)

**Token File Structure:**
- `design.tokens.json` - DTIF format document with all design tokens
- `designlint.config.ts` - Imports tokens and configures linting rules
- Tokens follow DTIF specification: `$version`, `$type`, `$value` structure

**Next Steps:**
- Monitor linting output in staging builds
- Review warnings and fix violations
- Consider escalating rules from 'warn' to 'error' once violations are fixed

