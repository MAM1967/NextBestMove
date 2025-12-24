# GitHub Secrets Setup Checklist

Follow this checklist to set up environment-specific secrets and branch protection.

---

## ✅ Step 1: Add GitHub Secrets

### Staging Secrets

Go to: `https://github.com/MAM1967/NextBestMove/settings/secrets/actions`

Click **"New repository secret"** for each:

1. **Name:** `NEXT_PUBLIC_SUPABASE_URL_STAGING`
   - **Value:** Get from Doppler `stg` config or Vercel Preview environment
   - **Source:** `NEXT_PUBLIC_SUPABASE_URL` from staging Supabase project

2. **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING`
   - **Value:** Get from Doppler `stg` config or Vercel Preview environment
   - **Source:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` from staging Supabase project

3. **Name:** `SUPABASE_SERVICE_ROLE_KEY_STAGING`
   - **Value:** Get from Doppler `stg` config or Vercel Preview environment
   - **Source:** `SUPABASE_SERVICE_ROLE_KEY` from staging Supabase project

### Production Secrets

Click **"New repository secret"** for each:

4. **Name:** `NEXT_PUBLIC_SUPABASE_URL_PRODUCTION`
   - **Value:** Get from Doppler `prd` config or Vercel Production environment
   - **Source:** `NEXT_PUBLIC_SUPABASE_URL` from production Supabase project

5. **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION`
   - **Value:** Get from Doppler `prd` config or Vercel Production environment
   - **Source:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` from production Supabase project

6. **Name:** `SUPABASE_SERVICE_ROLE_KEY_PRODUCTION`
   - **Value:** Get from Doppler `prd` config or Vercel Production environment
   - **Source:** `SUPABASE_SERVICE_ROLE_KEY` from production Supabase project

### Verification

After adding all 6 secrets, verify:
- ✅ All 6 secrets appear in the secrets list
- ✅ Names match exactly (case-sensitive)
- ✅ Values are correct (double-check staging vs production)

---

## ✅ Step 2: Test CI Workflow

1. Create a test branch:
   ```bash
   git checkout -b test/github-secrets-update
   ```

2. Push the updated CI workflow:
   ```bash
   git add .github/workflows/ci.yml
   git commit -m "Update CI to use environment-specific secrets"
   git push origin test/github-secrets-update
   ```

3. Create a PR to `staging` branch
4. Verify CI runs successfully
5. Check that it uses staging secrets (check logs)

---

## ✅ Step 3: Enable Branch Protection for `staging` (Using Rulesets)

1. Go to: `https://github.com/MAM1967/NextBestMove/settings/rules`
2. Click **"Add branch ruleset"** button
3. **Ruleset Name:** `Protect staging branch`
4. **Enforcement status:** Select **"Active"**
5. **Target branches:**
   - Click **"Add target"**
   - Select **"Branch name"**
   - Enter: `staging`
   - Click **"Add"**
6. **Rules section** - Enable these checkboxes:

   ✅ **Block force pushes**

   ✅ **Restrict deletions**

   ✅ **Require a pull request before merging**
      - Click to expand
      - Set **Required approvals:** `1`
      - ✅ Check "Dismiss stale pull request approvals when new commits are pushed"

   ✅ **Require status checks to pass**
      - Click to expand
      - **⚠️ IMPORTANT:** Status checks must have run at least once to appear here
      - If checks aren't visible yet:
        1. Push a commit to trigger CI first
        2. Wait for workflow to complete
        3. Return to this ruleset configuration
        4. Search for and select:
           - `lint-and-typecheck`
           - `unit-tests`
           - `integration-tests`
           - `e2e-tests`
           - `build`
      - ✅ Check "Require branches to be up to date before merging"

   ⚠️ **Require linear history** (optional)

7. Click **"Create ruleset"** at the bottom

---

## ✅ Step 4: Enable Branch Protection for `main` (Using Rulesets)

1. Still in: `https://github.com/MAM1967/NextBestMove/settings/rules`
2. Click **"Add branch ruleset"** button again
3. **Ruleset Name:** `Protect main branch`
4. **Enforcement status:** Select **"Active"**
5. **Target branches:**
   - Click **"Add target"**
   - Select **"Branch name"**
   - Enter: `main`
   - Click **"Add"`
6. **Rules section** - Enable these checkboxes:

   ✅ **Block force pushes**

   ✅ **Restrict deletions**

   ✅ **Require a pull request before merging**
      - Click to expand
      - Set **Required approvals:** `1` (recommended for production)
      - ✅ Check "Dismiss stale pull request approvals when new commits are pushed"

   ✅ **Require status checks to pass**
      - Click to expand
      - Select all status checks:
        - `lint-and-typecheck`
        - `unit-tests`
        - `integration-tests`
        - `e2e-tests` (required for production)
        - `build`
      - ✅ Check "Require branches to be up to date before merging"

   ✅ **Require linear history** (recommended for production)

7. Click **"Create ruleset"** at the bottom

---

## ✅ Step 5: Test Branch Protection

### Test with Staging

1. Create a test branch with a TypeScript error:
   ```bash
   git checkout -b test/branch-protection-staging
   # Add a TypeScript error to a file
   git add .
   git commit -m "Test: Add intentional error"
   git push origin test/branch-protection-staging
   ```

2. Create PR to `staging`
3. Verify:
   - ✅ CI runs
   - ✅ CI fails (due to TypeScript error)
   - ✅ Merge button is disabled
   - ✅ Error message shows which checks failed

4. Fix the error and push again
5. Verify:
   - ✅ CI passes
   - ✅ Merge button is enabled

### Test with Main

1. Create a PR from `staging` to `main`
2. Verify:
   - ✅ All checks must pass
   - ✅ PR review might be required (if enabled)
   - ✅ Merge is blocked until all requirements met

---

## ✅ Step 6: Cleanup (Optional)

Once everything works:

1. **Remove old secrets** (if they exist):
   - `SUPABASE_URL` (if exists)
   - `NEXT_PUBLIC_SUPABASE_URL` (if exists, without suffix)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (if exists, without suffix)
   - `SUPABASE_SERVICE_ROLE_KEY` (if exists, without suffix)

   **⚠️ Only remove after confirming new secrets work!**

2. **Update documentation**:
   - Update any docs that reference old secret names
   - Document the new naming convention

---

## Troubleshooting

### Secrets Not Found

**Error:** `Secret not found: NEXT_PUBLIC_SUPABASE_URL_STAGING`

**Solution:**
- Verify secret name matches exactly (case-sensitive)
- Check that secret is added in the correct repository
- Ensure you're looking at the right GitHub repository

### CI Uses Wrong Secrets

**Problem:** CI on `main` branch uses staging secrets

**Solution:**
- Check the conditional logic in `.github/workflows/ci.yml`
- Verify `github.ref == 'refs/heads/main'` condition
- Test with a PR to main to verify

### Branch Protection Not Working

**Problem:** Can merge even when CI fails

**Solution:**
- Verify branch protection rule is enabled
- Check that status checks are selected in the rule
- Ensure workflow has run at least once (checks need to exist first)
- Verify you're testing on the correct branch

---

## Quick Reference

### Secret Names

**Staging:**
- `NEXT_PUBLIC_SUPABASE_URL_STAGING`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING`
- `SUPABASE_SERVICE_ROLE_KEY_STAGING`

**Production:**
- `NEXT_PUBLIC_SUPABASE_URL_PRODUCTION`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION`
- `SUPABASE_SERVICE_ROLE_KEY_PRODUCTION`

### Branch Protection Settings

**Both `staging` and `main`:**
- ✅ Require status checks: `lint-and-typecheck`, `unit-tests`, `integration-tests`, `e2e-tests`, `build`
- ✅ Require branches to be up to date
- ✅ Do not allow force pushes
- ✅ Do not allow deletions

**`main` only:**
- ✅ Require PR reviews (recommended)
- ✅ Require linear history (optional)

---

**Status:** Ready to implement

