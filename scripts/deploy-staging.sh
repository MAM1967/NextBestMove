#!/bin/bash
# Complete deployment workflow for Staging
# Runs: type-check -> doppler sync (preview) -> git push to staging
# Usage: ./scripts/deploy-staging.sh [optional commit message]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$PROJECT_ROOT/web"

COMMIT_MESSAGE="${1:-Deploy to staging}"

echo "🚀 Starting Staging Deployment Workflow"
echo "========================================"
echo ""

# Step 1: Type Check
echo "📋 Step 1/5: Running TypeScript type check..."
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
echo "📋 Step 2/5: Running design lint (staging testing)..."
cd "$WEB_DIR"
if ! npm run lint:design; then
    echo "⚠️  Design lint warnings found. Continuing deployment..."
    # Don't fail build, just warn (change to exit 1 if you want strict enforcement)
fi
echo "✅ Design lint complete"
echo ""

# Step 3: Sync Doppler to Preview
echo "📋 Step 3/5: Syncing Doppler secrets to Vercel Preview..."
cd "$PROJECT_ROOT"
if ! bash "$SCRIPT_DIR/sync-doppler-to-vercel-preview.sh"; then
    echo "❌ Doppler sync failed! Aborting deployment."
    exit 1
fi
echo "✅ Doppler sync complete"
echo ""

# Step 4: Git push to staging
echo "📋 Step 4/5: Pushing to staging branch..."
cd "$PROJECT_ROOT"

# Check if we're on staging branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "staging" ]; then
    echo "⚠️  Warning: You're not on 'staging' branch (current: $CURRENT_BRANCH)"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes. Staging them for commit..."
    git add -A
    git commit -m "$COMMIT_MESSAGE" || {
        echo "⚠️  No changes to commit, continuing..."
    }
fi

# Push to staging
echo "📤 Pushing to origin/staging..."
git push origin staging

echo ""
echo "✅ Staging deployment workflow complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Vercel will automatically build and deploy from staging branch"
echo "   2. Preview builds will use the Doppler secrets we just synced"
echo "   3. Monitor deployment at: https://vercel.com/dashboard"

