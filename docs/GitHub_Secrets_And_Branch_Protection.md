# GitHub Secrets & Branch Protection Setup Guide

This guide covers:

1. How to name Supabase secrets for staging vs production in GitHub Secrets
2. How to implement branch protection rules

---

## 1. GitHub Secrets Naming Strategy

### Problem

We need different Supabase credentials for staging and production, but GitHub Secrets can't have duplicate names. We need a strategy to use the right secrets based on the branch.

### Solution: Environment-Specific Secret Names

Use environment suffixes in secret names, then conditionally select them in the CI workflow based on the branch.

### Secret Naming Convention

**For Staging:**

- `NEXT_PUBLIC_SUPABASE_URL_STAGING`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING`
- `SUPABASE_SERVICE_ROLE_KEY_STAGING`

**For Production:**

- `NEXT_PUBLIC_SUPABASE_URL_PRODUCTION`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION`
- `SUPABASE_SERVICE_ROLE_KEY_PRODUCTION`

### How to Add Secrets in GitHub

1. Go to your repository: `https://github.com/MAM1967/NextBestMove`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the environment suffix:

**Staging Secrets (add these first):**

```
Name: NEXT_PUBLIC_SUPABASE_URL_STAGING
Value: [Your staging Supabase URL from Doppler stg config]

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING
Value: [Your staging Supabase anon key from Doppler stg config]

Name: SUPABASE_SERVICE_ROLE_KEY_STAGING
Value: [Your staging Supabase service role key from Doppler stg config]
```

**Production Secrets (add these separately):**

```
Name: NEXT_PUBLIC_SUPABASE_URL_PRODUCTION
Value: [Your production Supabase URL from Doppler prd config]

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION
Value: [Your production Supabase anon key from Doppler prd config]

Name: SUPABASE_SERVICE_ROLE_KEY_PRODUCTION
Value: [Your production Supabase service role key from Doppler prd config]
```

### Where to Get the Values

**Staging values:**

- From Doppler: `stg` config
- Or from Vercel Preview environment variables

**Production values:**

- From Doppler: `prd` config
- Or from Vercel Production environment variables

---

## 2. Updating CI Workflow to Use Environment-Specific Secrets

The CI workflow needs to conditionally select secrets based on the branch.

### Current State

The workflow currently uses:

```yaml
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

### Updated Approach

Use conditional logic to select the right secrets based on the branch:

```yaml
env:
  # Determine environment based on branch
  IS_PRODUCTION: ${{ github.ref == 'refs/heads/main' }}
  IS_STAGING: ${{ github.ref == 'refs/heads/staging' || github.ref == 'refs/heads/main' }}

  # Conditionally select secrets based on branch
  NEXT_PUBLIC_SUPABASE_URL: ${{ github.ref == 'refs/heads/main' && secrets.NEXT_PUBLIC_SUPABASE_URL_PRODUCTION || secrets.NEXT_PUBLIC_SUPABASE_URL_STAGING }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ github.ref == 'refs/heads/main' && secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION || secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ github.ref == 'refs/heads/main' && secrets.SUPABASE_SERVICE_ROLE_KEY_PRODUCTION || secrets.SUPABASE_SERVICE_ROLE_KEY_STAGING }}
```

**Note:** For PRs, we'll default to staging secrets (safer for testing).

---

## 3. Branch Protection Setup

> **📖 For detailed Rulesets setup instructions that match the current GitHub UI, see:** [`GitHub_Rulesets_Setup_Guide.md`](./GitHub_Rulesets_Setup_Guide.md)
>
> The instructions below reference the classic branch protection interface. GitHub now uses **Rulesets** which has a different UI. The new guide above walks through the exact steps for the Rulesets interface.

### Overview

Branch protection rules prevent broken code from reaching production by requiring all CI checks to pass before merging.

### Benefits

- ✅ Prevents broken code from reaching production
- ✅ Enforces quality gates (lint, tests, build)
- ✅ Prevents force-push to protected branches
- ✅ Maintains audit trail

### Setup Instructions

#### Step 1: Navigate to Branch Protection Settings

1. Go to your repository: `https://github.com/MAM1967/NextBestMove`
2. Click **Settings** (top navigation)
3. Click **Branches** (left sidebar)
4. Under **Branch protection rules**, click **Add rule**

#### Step 2: Configure Protection for `staging` Branch

**Branch name pattern:** `staging`

**Enable these settings:**

1. **Require status checks to pass before merging** ✅

   - Check: `lint-and-typecheck`
   - Check: `unit-tests`
   - Check: `integration-tests`
   - Check: `e2e-tests` (optional - can be slower, but recommended)
   - Check: `build`

2. **Require branches to be up to date before merging** ✅

   - Ensures PR is based on latest code

3. **Do not allow force pushes** ✅

   - Prevents history rewriting

4. **Do not allow deletions** ✅

   - Prevents accidental branch deletion

5. **Require pull request reviews before merging** (optional)
   - At least 1 approval
   - Dismiss stale reviews when new commits are pushed
   - Require review from Code Owners (if you have a CODEOWNERS file)

**Click "Create" to save the rule.**

#### Step 3: Configure Protection for `main` Branch

**Branch name pattern:** `main`

**Enable the same settings as staging, plus:**

1. **Require status checks to pass before merging** ✅

   - Check: `lint-and-typecheck`
   - Check: `unit-tests`
   - Check: `integration-tests`
   - Check: `e2e-tests` (highly recommended for production)
   - Check: `build`

2. **Require branches to be up to date before merging** ✅

3. **Do not allow force pushes** ✅

4. **Do not allow deletions** ✅

5. **Require pull request reviews before merging** (recommended for production)

   - At least 1 approval
   - Dismiss stale reviews when new commits are pushed

6. **Require linear history** (optional but recommended)

   - Prevents merge commits, enforces rebase workflow

7. **Include administrators** (optional)
   - If unchecked, even admins must follow these rules

**Click "Create" to save the rule.**

### Visual Guide

```
Ruleset: Protect staging branch
├─ Name: Protect staging branch
├─ Enforcement: Active
├─ Target branches: staging
├─ Rules:
│  ├─ ✅ Block force pushes
│  ├─ ✅ Restrict deletions
│  ├─ ✅ Require a pull request before merging
│  │  ├─ Required approvals: 1
│  │  └─ Dismiss stale approvals: Yes
│  ├─ ✅ Require status checks to pass
│  │  ├─ lint-and-typecheck
│  │  ├─ unit-tests
│  │  ├─ integration-tests
│  │  ├─ e2e-tests
│  │  ├─ build
│  │  └─ ✅ Require branches to be up to date
│  └─ ⚠️ Require linear history (optional)

Ruleset: Protect main branch
├─ Name: Protect main branch
├─ Enforcement: Active
├─ Target branches: main
├─ Rules:
│  ├─ ✅ Block force pushes
│  ├─ ✅ Restrict deletions
│  ├─ ✅ Require a pull request before merging
│  │  ├─ Required approvals: 1
│  │  └─ Dismiss stale approvals: Yes
│  ├─ ✅ Require status checks to pass
│  │  ├─ lint-and-typecheck
│  │  ├─ unit-tests
│  │  ├─ integration-tests
│  │  ├─ e2e-tests (required)
│  │  ├─ build
│  │  └─ ✅ Require branches to be up to date
│  └─ ✅ Require linear history (recommended)
```

### Important Notes

**Status Checks Availability:**

- Status checks only appear in the dropdown after the CI workflow has run at least once
- If you don't see the checks yet:
  1. Push a commit to trigger CI
  2. Wait for the workflow to complete
  3. Return to the ruleset configuration
  4. The checks will now be available to select

**Alternative: Use Classic Branch Protection**

- If you prefer the older interface, click **"Add classic branch protection rule"** instead
- Classic rules work the same way but use a different UI

### How It Works

1. Developer creates PR to `staging` or `main`
2. GitHub automatically runs CI checks
3. All checks must pass before merge is allowed
4. If any check fails, merge is blocked
5. Developer fixes issues and pushes again
6. CI re-runs, and merge is allowed once all pass

### Testing Branch Protection

1. Create a test branch
2. Make a change that breaks tests (e.g., add a TypeScript error)
3. Push and create PR to `staging`
4. Verify that:
   - CI runs and fails
   - Merge button is disabled
   - Error message shows which checks failed
5. Fix the issue and push again
6. Verify that:
   - CI passes
   - Merge button is enabled

---

## 4. Migration Plan

### Phase 1: Add New Secrets (Do This First)

1. Add all 6 new secrets to GitHub (3 staging + 3 production)
2. Verify they're added correctly in GitHub Settings

### Phase 2: Update CI Workflow

1. Update `.github/workflows/ci.yml` to use conditional secret selection
2. Test on a feature branch first
3. Verify staging branch CI still works
4. Test on main branch (or a PR to main)

### Phase 3: Enable Branch Protection

1. Enable protection for `staging` branch first
2. Test with a PR to staging
3. Enable protection for `main` branch
4. Test with a PR to main

### Phase 4: Cleanup (Optional)

Once everything works, you can optionally:

- Remove old secrets (if they exist)
- Document the new secret names in team docs

---

## 5. Troubleshooting

### CI Fails After Adding Branch Protection

**Problem:** CI checks aren't showing up in branch protection settings

**Solution:**

- Make sure the workflow file is in `.github/workflows/`
- Push a commit to trigger the workflow
- Wait for the workflow to run at least once
- The check names will appear in branch protection settings after first run

### Secrets Not Found

**Problem:** Workflow fails with "Secret not found"

**Solution:**

- Verify secret names match exactly (case-sensitive)
- Check that secrets are added in the correct repository
- Ensure you're using the right secret names in the workflow

### Can't Merge PR

**Problem:** Merge button is disabled even though CI passed

**Solution:**

- Check that all required status checks are selected in branch protection
- Verify the branch is up to date (click "Update branch" if needed)
- Check that PR reviews are completed (if required)

---

## Summary

1. **Secrets:** Use environment suffixes (`_STAGING`, `_PRODUCTION`) and conditionally select in CI
2. **Branch Protection:** Enable for both `staging` and `main` with required status checks
3. **Testing:** Test branch protection with a test PR before relying on it

This setup ensures:

- ✅ Staging and production use correct credentials
- ✅ Broken code can't reach production
- ✅ Quality gates are enforced automatically
- ✅ Team can merge with confidence
