# GitHub Rulesets Setup Guide

This guide walks you through setting up branch protection using GitHub's **Rulesets** interface (the newer system).

---

## Step-by-Step: Configure Ruleset for `staging` Branch

### 1. Navigate to Rulesets

1. Go to: `https://github.com/MAM1967/NextBestMove/settings/rules`
2. Click **"Add branch ruleset"** button

### 2. Configure Ruleset

**Ruleset Name:**

- Enter: `Protect staging branch`

**Enforcement status:**

- Select: **"Active"** (dropdown)

**Bypass list:**

- Leave empty (or add users/teams if needed)

**Target branches:**

- Click **"Add target"** button
- Select **"Branch name"** from dropdown
- Enter: `staging`
- Click **"Add"**

**Rules section:**
Scroll down to find the **"Rules"** section with checkboxes. Enable:

✅ **Block force pushes**

- Check this box

✅ **Restrict deletions**

- Check this box

✅ **Require a pull request before merging**

- Check this box
- Click to expand the rule
- Set **Required approvals:** `1`
- ✅ Check "Dismiss stale pull request approvals when new commits are pushed"
- ⚠️ "Require review from Code Owners" (optional - only if you have CODEOWNERS file)

✅ **Require status checks to pass**

- Check this box
- Click to expand the rule
- **⚠️ IMPORTANT:** Status checks only appear after CI has run at least once
- If you don't see checks yet:
  1.  Save this ruleset first (click "Create ruleset")
  2.  Push a commit to trigger CI
  3.  Wait for CI to complete
  4.  Edit the ruleset and add status checks
- Once available, search for and select:
  - `lint-and-typecheck`
  - `unit-tests`
  - `integration-tests`
  - `e2e-tests`
  - `build`
- ✅ Check "Require branches to be up to date before merging"

⚠️ **Require linear history** (optional)

- Check this box if you want to prevent merge commits

**Click "Create ruleset"** at the bottom to save.

---

## Step-by-Step: Configure Ruleset for `main` Branch

### 1. Add Another Ruleset

1. Still in: `https://github.com/MAM1967/NextBestMove/settings/rules`
2. Click **"Add branch ruleset"** button again

### 2. Configure Ruleset

**Ruleset Name:**

- Enter: `Protect main branch`

**Enforcement status:**

- Select: **"Active"**

**Bypass list:**

- Leave empty (recommended for production)

**Target branches:**

- Click **"Add target"**
- Select **"Branch name"**
- Enter: `main`
- Click \*\*"Add"`

**Rules section:**
Enable these checkboxes:

✅ **Block force pushes**

✅ **Restrict deletions**

✅ **Require a pull request before merging**

- Required approvals: `1` (recommended for production)
- ✅ Dismiss stale approvals

✅ **Require status checks to pass**

- Select all:
  - `lint-and-typecheck`
  - `unit-tests`
  - `integration-tests`
  - `e2e-tests` (highly recommended for production)
  - `build`
- ✅ Require branches to be up to date

✅ **Require linear history** (recommended for production)

**Click "Create ruleset"** to save.

---

## Important Notes

### Status Checks Timing

**Status checks must exist before you can select them:**

1. First, create and save the ruleset (even without status checks)
2. Push a commit to trigger your CI workflow
3. Wait for the workflow to complete
4. Edit the ruleset
5. Status checks will now appear in the dropdown
6. Select the checks you want
7. Save the ruleset again

### Rule Checkboxes Mapping

The Rulesets interface uses these checkboxes (which match what you're seeing):

- ✅ **Block force pushes** = "Do not allow force pushes"
- ✅ **Restrict deletions** = "Do not allow deletions"
- ✅ **Require a pull request before merging** = "Require PR reviews"
- ✅ **Require status checks to pass** = "Require status checks to pass before merging"
- ✅ **Require linear history** = "Require linear history"

### Alternative: Classic Branch Protection

If you prefer the older interface:

- Click **"Add classic branch protection rule"** instead
- This uses the older UI but works the same way

---

## Testing Your Rulesets

1. Create a test branch
2. Make a change that breaks tests
3. Push and create PR to `staging`
4. Verify:
   - ✅ Merge button is disabled
   - ✅ Error shows which checks failed
5. Fix the issue and push again
6. Verify:
   - ✅ All checks pass
   - ✅ Merge button is enabled

---

## Troubleshooting

**Status checks don't appear:**

- CI workflow must run at least once first
- Check that workflow file is in `.github/workflows/`
- Verify workflow completed successfully

**Can't save ruleset:**

- Make sure "Enforcement status" is set to "Active"
- Verify target branch name is correct
- Check that at least one rule is enabled

**Merge still allowed when checks fail:**

- Verify ruleset is "Active" (not "Disabled")
- Check that status checks are actually selected
- Ensure "Require branches to be up to date" is checked
