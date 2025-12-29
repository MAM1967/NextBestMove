# GitHub Actions Secrets Setup

This document explains how to configure GitHub Actions secrets for CI/CD workflows.

## Required Secrets

The CI workflow supports both naming conventions for flexibility:

### Option 1: Environment-Specific Names (Recommended)

If you want separate secrets for staging and production:

**For Staging (PRs and staging branch):**
- `NEXT_PUBLIC_SUPABASE_URL_STAGING` - Staging Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING` - Staging Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY_STAGING` - Staging Supabase service role key

**For Production (main branch):**
- `NEXT_PUBLIC_SUPABASE_URL_PROD` - Production Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD` - Production Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY_PROD` - Production Supabase service role key

### Option 2: Generic Names (Current Setup)

If you're using generic secret names (already configured):

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (should be staging for PRs, production for main)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

**⚠️ Important:** With generic names, you must ensure:
- For PRs and staging branch: These secrets contain **staging** credentials
- For main branch: These secrets contain **production** credentials

**Recommendation:** Use environment-specific names (`*_STAGING` and `*_PROD`) to prevent accidentally using the wrong environment.

### Optional Secrets

- `PLAYWRIGHT_TEST_BASE_URL` - Base URL for E2E tests (defaults to `http://localhost:3000`)

## How to Add Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name listed above
5. Paste the corresponding value from your Supabase project settings

## Important Notes

⚠️ **CRITICAL**: Always use **STAGING** credentials for PRs and the staging branch. Never use production credentials in CI unless you're testing on the main branch.

⚠️ **Security**: These secrets are encrypted and only accessible to GitHub Actions workflows. They are never exposed in logs or output.

## How It Works

The CI workflow automatically selects the correct secrets based on the branch:

- **Pull requests** → Uses `*_STAGING` secrets
- **`staging` branch** → Uses `*_STAGING` secrets
- **`main` branch** → Uses `*_PROD` secrets

This ensures:

- PRs and staging tests never touch production data
- Production tests (on main branch) use production credentials
- No risk of accidentally using wrong environment

## Test Behavior

If secrets are not configured:

- Integration tests will **skip** (not fail) gracefully
- Tests will show as "skipped" in CI results
- CI will still pass, but tests won't run

Once secrets are configured:

- Tests will run automatically
- Integration tests will use the appropriate environment
- E2E tests will connect to the correct Supabase instance

## Verifying Setup

After adding secrets, check the CI workflow logs:

1. Go to **Actions** tab in GitHub
2. Click on a workflow run
3. Check the "Run integration tests" step
4. If secrets are set correctly, tests will run
5. If secrets are missing, tests will be skipped with a message
