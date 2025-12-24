# GitHub Secrets & Branch Protection - Verification Checklist

## ✅ Completed Setup

### GitHub Secrets Added

**Staging Secrets:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL_STAGING`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING`
- ✅ `SUPABASE_SERVICE_ROLE_KEY_STAGING`

**Production Secrets:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL_PRODUCTION`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION`
- ✅ `SUPABASE_SERVICE_ROLE_KEY_PRODUCTION`

### Branch Protection Rulesets Created

**Staging Ruleset:**
- ✅ Name: `Protect staging branch`
- ✅ Target: `staging` branch
- ✅ Rules configured

**Main Ruleset:**
- ✅ Name: `Protect main branch`
- ✅ Target: `main` branch
- ✅ Rules configured

---

## 🧪 Verification Steps

### 1. Test CI Workflow with New Secrets

**Test on staging branch:**
```bash
# Create a test branch
git checkout -b test/verify-secrets-staging
git push origin test/verify-secrets-staging

# Create PR to staging
# Verify CI runs and uses staging secrets
```

**Test on main branch (or PR to main):**
```bash
# Create a test branch
git checkout -b test/verify-secrets-production
git push origin test/verify-secrets-production

# Create PR to main
# Verify CI runs and uses production secrets
```

**What to check:**
- ✅ CI workflow runs successfully
- ✅ Tests pass
- ✅ Secrets are being used (check workflow logs - secrets will be masked but workflow should complete)

### 2. Test Branch Protection

**Test staging protection:**
1. Create a branch with a TypeScript error
2. Push and create PR to `staging`
3. Verify:
   - ✅ CI runs
   - ✅ CI fails (due to error)
   - ✅ Merge button is disabled
   - ✅ Error message shows which checks failed

4. Fix the error and push again
5. Verify:
   - ✅ CI passes
   - ✅ Merge button is enabled

**Test main protection:**
1. Create PR from `staging` to `main`
2. Verify:
   - ✅ All status checks must pass
   - ✅ PR review might be required (if enabled)
   - ✅ Merge is blocked until all requirements met

### 3. Verify Status Checks in Rulesets

**Important:** If you haven't added status checks yet:

1. Push a commit to trigger CI
2. Wait for CI to complete
3. Edit each ruleset:
   - Go to: `https://github.com/MAM1967/NextBestMove/settings/rules`
   - Click on the ruleset name
   - Click "Edit"
   - Scroll to "Require status checks to pass"
   - Expand the rule
   - Select the checks:
     - `lint-and-typecheck`
     - `unit-tests`
     - `integration-tests`
     - `e2e-tests`
     - `build`
   - ✅ Check "Require branches to be up to date before merging"
   - Save

---

## 🔍 How to Verify Secrets Are Working

### Check Workflow Logs

1. Go to: `https://github.com/MAM1967/NextBestMove/actions`
2. Click on a recent workflow run
3. Check the logs - secrets will be masked (shown as `***`)
4. Verify workflow completes successfully

### Test Environment Detection

The CI workflow uses conditional logic:
- `main` branch → uses `_PRODUCTION` secrets
- `staging` branch or PRs → uses `_STAGING` secrets

To verify:
1. Check workflow logs on `main` branch push
2. Check workflow logs on `staging` branch push
3. Both should complete successfully (using different secrets)

---

## 📝 Next Steps

1. **Add Status Checks to Rulesets** (if not done yet)
   - Wait for CI to run once
   - Edit rulesets to add status checks

2. **Test Branch Protection**
   - Create test PRs to verify protection works

3. **Monitor First Production Deploy**
   - When ready to deploy to production
   - Verify production secrets are used correctly

4. **Document Any Issues**
   - If you encounter problems, document them
   - Update this guide with solutions

---

## 🐛 Troubleshooting

### CI Fails with "Secret not found"

**Problem:** Workflow can't find secrets

**Solution:**
- Verify secret names match exactly (case-sensitive)
- Check secrets are in the correct repository
- Ensure you're using the right secret names in workflow

### Wrong Secrets Being Used

**Problem:** Production branch using staging secrets (or vice versa)

**Solution:**
- Check the conditional logic in `.github/workflows/ci.yml`
- Verify `github.ref == 'refs/heads/main'` condition
- Test with a PR to main to verify

### Status Checks Not Appearing

**Problem:** Can't select status checks in ruleset

**Solution:**
- CI workflow must run at least once first
- Check workflow file is in `.github/workflows/`
- Verify workflow completed successfully
- Refresh the ruleset edit page

### Branch Protection Not Working

**Problem:** Can merge even when CI fails

**Solution:**
- Verify ruleset is "Active" (not "Disabled")
- Check that status checks are actually selected
- Ensure "Require branches to be up to date" is checked
- Verify you're testing on the correct branch

---

## ✅ Success Criteria

Setup is complete when:

- ✅ All 6 secrets are added to GitHub
- ✅ Both rulesets are created and active
- ✅ CI runs successfully on both staging and main branches
- ✅ Status checks are added to both rulesets
- ✅ Branch protection blocks merges when checks fail
- ✅ Branch protection allows merges when checks pass

---

**Status:** ✅ Setup Complete - Ready for Testing

