#!/bin/bash
# Complete deployment workflow for Production
# Runs: type-check -> doppler sync (production) -> git push to main
# Usage: ./scripts/deploy-production.sh [optional commit message]

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
echo "📋 Step 2/4: Running design lint..."
cd "$WEB_DIR"
if ! npm run lint:design; then
    echo "⚠️  Design lint warnings found. Continuing deployment..."
    # Don't fail build, just warn (change to exit 1 if you want strict enforcement)
fi
echo "✅ Design lint complete"
echo ""

# Step 3: Sync Doppler to Production
echo "📋 Step 2/3: Syncing Doppler secrets to Vercel Production..."
cd "$PROJECT_ROOT"
if ! bash "$SCRIPT_DIR/sync-doppler-to-vercel.sh"; then
    echo "❌ Doppler sync failed! Aborting deployment."
    exit 1
fi
echo "✅ Doppler sync complete"
echo ""

# Step 4: Git push to main
echo "📋 Step 4/4: Pushing to main branch..."
cd "$PROJECT_ROOT"

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Warning: You're not on 'main' branch (current: $CURRENT_BRANCH)"
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

# Push to main
echo "📤 Pushing to origin/main..."
git push origin main

echo ""
echo "✅ Production deployment workflow complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Vercel will automatically build and deploy from main branch"
echo "   2. Production will use the Doppler secrets we just synced"
echo "   3. Monitor deployment at: https://vercel.com/dashboard"
echo ""
echo "⚠️  Remember to verify the production deployment is working correctly!"

