#!/bin/bash
# Complete deployment workflow for Staging
# Runs: type-check -> doppler sync (preview) -> create PR to staging
# Usage: ./scripts/deploy-staging.sh [optional commit message]
#
# Note: Due to branch protection rules, this creates a feature branch
# and provides a PR link. The PR must be merged after CI checks pass.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$PROJECT_ROOT/web"

COMMIT_MESSAGE="${1:-Deploy to staging}"

echo "🚀 Starting Staging Deployment Workflow"
echo "========================================"
echo ""

# Step 1: Type Check
echo "📋 Step 1/6: Running TypeScript type check..."
cd "$WEB_DIR"
if ! npm run type-check; then
    echo "❌ Type check failed! Aborting deployment."
    exit 1
fi
echo "✅ Type check passed"
echo ""

# Step 2: Design Lint (Optional - requires Node.js 22+)
# Currently enabled for staging testing with minimal config
# Set to warn mode - won't block deployment
echo "📋 Step 2/6: Running design lint (staging testing)..."
cd "$WEB_DIR"
if ! npm run lint:design; then
    echo "⚠️  Design lint warnings found. Continuing deployment..."
    # Don't fail build, just warn (change to exit 1 if you want strict enforcement)
fi
echo "✅ Design lint complete"
echo ""

# Step 3: Sync Doppler to Preview
echo "📋 Step 3/6: Syncing Doppler secrets to Vercel Preview..."
cd "$PROJECT_ROOT"
if ! bash "$SCRIPT_DIR/sync-doppler-to-vercel-preview.sh"; then
    echo "❌ Doppler sync failed! Aborting deployment."
    exit 1
fi
echo "✅ Doppler sync complete"
echo ""

# Step 4: Create feature branch and push
echo "📋 Step 4/6: Creating deployment branch..."
cd "$PROJECT_ROOT"

# Ensure we're on staging and up to date
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "staging" ]; then
    echo "📥 Switching to staging branch..."
    git checkout staging
    git pull origin staging
fi

# Create a unique branch name
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BRANCH_NAME="deploy/staging-${TIMESTAMP}"
echo "🌿 Creating branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "📝 Staging uncommitted changes..."
    git add -A
    git commit -m "$COMMIT_MESSAGE" || {
        echo "⚠️  No changes to commit, continuing..."
    }
fi

# Step 5: Push feature branch
echo "📋 Step 5/6: Pushing feature branch..."
echo "📤 Pushing to origin/$BRANCH_NAME..."
git push -u origin "$BRANCH_NAME"

# Step 6: Provide PR link
echo ""
echo "✅ Staging deployment branch created!"
echo ""
echo "📝 Next steps:"
echo "   1. Create a Pull Request:"
echo "      https://github.com/MAM1967/NextBestMove/compare/staging...$BRANCH_NAME"
echo ""
echo "   2. Wait for CI checks to pass:"
echo "      - lint-and-typecheck"
echo "      - unit-tests"
echo "      - integration-tests"
echo "      - e2e-tests"
echo "      - build"
echo ""
echo "   3. Merge the PR once all checks pass"
echo ""
echo "   4. After merge, Vercel will automatically deploy from staging branch"
echo "   5. Preview builds will use the Doppler secrets we just synced"
echo "   6. Monitor deployment at: https://vercel.com/dashboard"

