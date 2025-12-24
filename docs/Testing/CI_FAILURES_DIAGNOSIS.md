# CI Failures Diagnosis Guide

## Current Status

✅ **CI workflow is running** - The status checks exist and are visible  
❌ **All tests are failing** (except Build which passed)

## Failed Jobs

From the GitHub Actions run:
- ❌ **Lint & Type Check** (Failed - 36s)
- ❌ **Unit Tests** (Failed - 31s)
- ❌ **Integration Tests** (Failed - 31s)
- ❌ **E2E Tests (Playwright)** (Failed - 59s)
- ✅ **Build** (Passed - 1m 24s)
- ❌ **All Tests** (Failed - 2s)

## How to Diagnose

### Step 1: View the Workflow Run Logs

1. Go to: `https://github.com/MAM1967/NextBestMove/actions`
2. Click on the failed workflow run
3. Click on each failed job to see the error logs
4. Look for error messages at the bottom of each job's log

### Step 2: Common Failure Causes

#### A. Missing GitHub Secrets

The workflow requires these secrets:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STAGING_USER`
- `STAGING_PASS`

**Check**: Go to **Settings → Secrets and variables → Actions**

**Error signs**:
- "Secret not found" errors
- Authentication failures
- Connection refused errors

#### B. Missing Dependencies

**Error signs**:
- "Cannot find module" errors
- "Command not found" errors
- Import errors

**Fix**: Ensure `package.json` has all required dependencies

#### C. Test Configuration Issues

**Error signs**:
- "Test file not found"
- "Configuration error"
- "Timeout" errors

**Check**:
- `vitest.config.ts` exists and is correct
- `playwright.config.ts` exists and is correct
- Test files are in the right locations

#### D. Environment-Specific Issues

**Error signs**:
- Tests pass locally but fail in CI
- Network timeouts
- Database connection errors

**Common causes**:
- Different Node.js versions
- Missing environment variables
- Network/firewall issues

## Quick Fixes

### Fix 1: Check GitHub Secrets

```bash
# Verify secrets are set in GitHub
# Go to: Settings → Secrets and variables → Actions
# Add any missing secrets
```

### Fix 2: Test Locally First

```bash
cd web

# Run each test suite locally
npm run test:unit
npm run test:integration
npm run test:staging

# If they fail locally, fix them first
```

### Fix 3: Check Workflow File

Verify `.github/workflows/ci.yml`:
- All job names are correct
- All steps are correct
- Environment variables are set
- Working directory is correct (`./web`)

### Fix 4: Check Test Files

Verify test files exist:
```bash
ls -la web/tests/unit/
ls -la web/tests/integration/
ls -la web/tests/e2e/
```

## Most Likely Issues

Based on the workflow setup, here are the most probable causes:

### 1. **Missing Vitest/Playwright Dependencies**

Check `web/package.json` has:
- `vitest`
- `@playwright/test`
- `@testing-library/react`
- `@testing-library/jest-dom`

### 2. **Missing Test Scripts**

Verify `web/package.json` has:
```json
{
  "scripts": {
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:staging": "playwright test"
  }
}
```

### 3. **Missing Configuration Files**

Verify these exist:
- `web/vitest.config.ts`
- `web/playwright.config.ts`
- `web/tests/setup/vitest-setup.ts`

### 4. **Missing GitHub Secrets**

The workflow needs these secrets. Check:
- **Settings → Secrets and variables → Actions**
- Add any missing secrets

## Next Steps

1. **Click on each failed job** in GitHub Actions to see the exact error
2. **Copy the error message** from the logs
3. **Fix the issue** based on the error
4. **Push the fix** to trigger a new CI run
5. **Verify the checks pass**

## Example: Viewing Logs

1. Go to: `https://github.com/MAM1967/NextBestMove/actions`
2. Click on the failed run
3. Click on "Lint & Type Check" job
4. Scroll to the bottom to see the error
5. Look for lines starting with `Error:` or `Failed:`

## Status Checks Will Appear

Once the tests pass:
- ✅ Status checks will show as "success"
- ✅ They'll appear on all commits and PRs
- ✅ You can use them for branch protection

---

**TL;DR**: The status checks exist but are failing. Click on each failed job in GitHub Actions to see the error logs, then fix the issues.

