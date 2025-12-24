# CI Status Checks - Why You Don't See Them Yet

## The Issue

You're looking for these status checks in GitHub:
- `lint-and-typecheck`
- `unit-tests`
- `integration-tests`
- `e2e-tests`
- `build`

**These won't appear until the CI workflow runs at least once.**

## Why Status Checks Don't Appear Immediately

### 1. **Workflow Must Run First**
GitHub only shows status checks after a workflow has executed at least once. The workflow file exists (`.github/workflows/ci.yml`), but it needs to be triggered.

### 2. **Workflow Triggers**
The CI workflow runs on:
- ✅ Push to `main` branch
- ✅ Push to `staging` branch
- ✅ Pull requests targeting `main` or `staging`

### 3. **GitHub Actions Must Be Enabled**
- Go to: **Repository Settings → Actions → General**
- Ensure "Allow all actions and reusable workflows" is enabled
- Or at minimum, "Allow local actions and reusable workflows"

## How to Trigger the First Run

### Option 1: Push to Staging (Recommended)
Since we've already pushed to staging, the workflow should have triggered. Check:

1. Go to: **GitHub → Actions tab**
2. Look for a workflow run named "CI"
3. If you see runs, click on one to see the jobs

### Option 2: Create a Test PR
1. Create a new branch: `git checkout -b test-ci-run`
2. Make a small change (e.g., add a comment)
3. Push and create a PR to `staging`
4. The workflow will run automatically

### Option 3: Manual Trigger (if workflow supports it)
Some workflows support manual triggers. Check if `.github/workflows/ci.yml` has:
```yaml
on:
  workflow_dispatch:  # Allows manual trigger
```

## Checking if Workflow Has Run

### In GitHub UI:
1. Go to your repository on GitHub
2. Click the **"Actions"** tab
3. Look for workflow runs named "CI"
4. If you see runs, the workflow is working
5. If you see no runs, the workflow hasn't triggered yet

### Common Reasons Workflow Doesn't Run:

1. **GitHub Actions Disabled**
   - Settings → Actions → General
   - Check if Actions are enabled

2. **Workflow File Not in Correct Branch**
   - The workflow file must be in the branch you're pushing to
   - Check: `git ls-files .github/workflows/ci.yml`

3. **Syntax Error in Workflow**
   - GitHub will show an error in the Actions tab
   - Check for red X marks or error messages

4. **Missing Secrets**
   - Workflow might fail immediately if required secrets are missing
   - Check the workflow run logs

## What to Do Now

### Step 1: Check Actions Tab
1. Go to: `https://github.com/MAM1967/NextBestMove/actions`
2. Do you see any workflow runs?
   - ✅ **Yes**: Click on a run to see the jobs
   - ❌ **No**: Continue to Step 2

### Step 2: Verify Workflow File Exists
```bash
# In your local repo
ls -la .github/workflows/ci.yml
```

### Step 3: Check GitHub Actions is Enabled
1. Go to: **Settings → Actions → General**
2. Under "Actions permissions", ensure it's enabled

### Step 4: Trigger a Run
If no runs exist, trigger one:
```bash
# Make a small change and push
echo "# CI Test" >> README.md
git add README.md
git commit -m "Trigger CI workflow"
git push origin staging
```

### Step 5: Wait for Status Checks
After the workflow runs:
1. Go to any commit or PR
2. You should see the status checks appear
3. They'll show as "pending" while running
4. Then "success" or "failure" when complete

## Status Check Names

The status checks will appear with these exact names:
- `Lint & Type Check` (job: `lint-and-typecheck`)
- `Unit Tests` (job: `unit-tests`)
- `Integration Tests` (job: `integration-tests`)
- `E2E Tests (Playwright)` (job: `e2e-tests`)
- `Build` (job: `build`)
- `All Tests` (job: `all-tests`)

## For Branch Protection

Once the workflow has run at least once, you can:
1. Go to: **Settings → Branches**
2. Add a branch protection rule for `staging` or `main`
3. Under "Require status checks to pass before merging"
4. Select the checks from the list (they'll appear after first run)

## Quick Check Command

Run this to see if the workflow file is correct:
```bash
cat .github/workflows/ci.yml | grep -A 2 "name:"
```

You should see:
- `name: CI`
- `name: Lint & Type Check`
- `name: Unit Tests`
- etc.

---

**TL;DR**: Status checks only appear after the workflow runs at least once. Check the Actions tab to see if it has run. If not, make a small commit and push to trigger it.

