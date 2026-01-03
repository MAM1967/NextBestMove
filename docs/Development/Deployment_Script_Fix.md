# Deployment Script Fix: Critical Missing Step

## Problem

The deployment scripts (`deploy-staging.sh` and `deploy-production.sh`) had a critical flaw that caused PRs to show "no differences" between branches:

**Root Cause:**
1. Script switches to `staging`/`main` branch **before** capturing current branch's commits
2. Creates deployment branch **from** `staging`/`main` (which doesn't have our changes)
3. Only commits uncommitted changes (but if we already committed, there are none!)
4. **Result:** Deployment branch is identical to base branch → PR shows no differences

## The Critical Missing Step

**Before switching to the base branch, we must:**
1. Capture the current branch name
2. Commit any uncommitted changes on the current branch
3. **After** creating the deployment branch from base, **merge the current branch's commits into it**

## Solution Implemented

### Updated Workflow (Both Scripts)

```bash
# 1. Capture current branch BEFORE switching
CURRENT_BRANCH=$(git branch --show-current)

# 2. Commit any uncommitted changes on current branch
if [ "$HAS_UNCOMMITTED" != "0" ]; then
    git add -A
    git commit -m "$COMMIT_MESSAGE"
fi

# 3. Switch to base branch and update
git checkout staging  # or main
git pull origin staging

# 4. Create deployment branch from base
git checkout -b "$BRANCH_NAME"

# 5. CRITICAL: Merge current branch's commits into deployment branch
if [ "$CURRENT_BRANCH" != "staging" ] && [ "$CURRENT_BRANCH" != "$BRANCH_NAME" ]; then
    git merge "$CURRENT_BRANCH" --no-edit
fi
```

## Why This Works

- **Captures commits before switching:** We remember which branch we're on and its commits
- **Commits uncommitted changes first:** Ensures nothing is lost
- **Merges into deployment branch:** Brings our changes into the new branch
- **Result:** Deployment branch has both latest base branch AND our changes

## Testing

To verify the fix works:

1. Make changes on a feature branch (e.g., `deploy/staging-20260102-184937`)
2. Commit the changes
3. Run `./scripts/deploy-staging.sh "Test message"`
4. Check the PR - it should now show differences

## Prevention

This fix is now part of the deployment SOP. The scripts will:
- ✅ Always capture current branch before switching
- ✅ Always merge current branch commits into deployment branch
- ✅ Handle merge conflicts automatically (preferring current branch changes)

## Files Updated

- `scripts/deploy-staging.sh` - Fixed Step 4
- `scripts/deploy-production.sh` - Fixed Step 4 (same pattern)

## Related

- See `nextbestmove_cursor_guide.md` for deployment workflow documentation
- See `docs/backlog.md` for deployment-related tickets

