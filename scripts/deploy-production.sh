#!/bin/bash
# Complete deployment workflow for Production
# Runs: type-check -> doppler sync (production) -> create PR to main
# Usage: ./scripts/deploy-production.sh [optional commit message]
#
# Note: Due to branch protection rules, this creates a feature branch
# and provides a PR link. The PR must be merged after CI checks pass.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$PROJECT_ROOT/web"

COMMIT_MESSAGE="${1:-Deploy to production}"

echo "🚀 Starting Production Deployment Workflow"
echo "==========================================="
echo ""
echo "⚠️  WARNING: This will deploy to PRODUCTION"
echo "   Make sure you've tested in staging first!"
echo ""
read -p "Continue with production deployment? (yes/no) " -r
if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Step 1: Type Check
echo ""
echo "📋 Step 1/4: Running TypeScript type check..."
cd "$WEB_DIR"
if ! npm run type-check; then
    echo "❌ Type check failed! Aborting deployment."
    exit 1
fi
echo "✅ Type check passed"
echo ""

# Step 2: Design Lint (Optional - requires Node.js 22+)
# Currently enabled for production with minimal config
# Set to warn mode - won't block deployment
echo "📋 Step 2/5: Running design lint..."
cd "$WEB_DIR"
if ! npm run lint:design; then
    echo "⚠️  Design lint warnings found. Continuing deployment..."
    # Don't fail build, just warn (change to exit 1 if you want strict enforcement)
fi
echo "✅ Design lint complete"
echo ""

# Step 3: Sync Doppler to Production
echo "📋 Step 3/5: Syncing Doppler secrets to Vercel Production..."
cd "$PROJECT_ROOT"
if ! bash "$SCRIPT_DIR/sync-doppler-to-vercel.sh"; then
    echo "❌ Doppler sync failed! Aborting deployment."
    exit 1
fi
echo "✅ Doppler sync complete"
echo ""

# Step 4: Create feature branch and push
echo "📋 Step 4/5: Creating deployment branch..."
cd "$PROJECT_ROOT"

# Ensure we're on main and up to date
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "📥 Switching to main branch..."
    git checkout main
    git pull origin main
fi

# Create a unique branch name
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BRANCH_NAME="deploy/production-${TIMESTAMP}"
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
echo "📋 Step 5/5: Pushing feature branch..."
echo "📤 Pushing to origin/$BRANCH_NAME..."
git push -u origin "$BRANCH_NAME"

echo ""
echo "✅ Production deployment branch created!"
echo ""
echo "📝 Next steps:"
echo "   1. Create a Pull Request:"
echo "      https://github.com/MAM1967/NextBestMove/compare/main...$BRANCH_NAME"
echo ""
echo "   2. Wait for CI checks to pass:"
echo "      - lint-and-typecheck"
echo "      - unit-tests"
echo "      - integration-tests"
echo "      - e2e-tests"
echo "      - build"
echo ""
echo "   3. Get PR review approval (if required)"
echo ""
echo "   4. Merge the PR once all checks pass and review is approved"
echo ""
echo "   5. After merge, Vercel will automatically deploy from main branch"
echo "   6. Production will use the Doppler secrets we just synced"
echo "   7. Monitor deployment at: https://vercel.com/dashboard"
echo ""
echo "⚠️  Remember to verify the production deployment is working correctly!"

