#!/bin/bash

# Script to sync environment variables from .env.local to Vercel
# Usage: ./scripts/sync-env-to-vercel.sh

set -e

echo "🔄 Syncing environment variables to Vercel..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Install it with: npm install -g vercel"
    exit 1
fi

# Check if .env.local exists
if [ ! -f "web/.env.local" ]; then
    echo "❌ web/.env.local not found. Create it from web/.env.example"
    exit 1
fi

# Navigate to web directory
cd web

# Link project if not already linked
if [ ! -f ".vercel/project.json" ]; then
    echo "📦 Linking Vercel project..."
    vercel link
fi

# Read .env.local and sync each variable
echo "📤 Syncing variables from .env.local to Vercel..."
echo ""

# List of variables to sync (sensitive ones only)
VARS=(
    "SUPABASE_SERVICE_ROLE_KEY"
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "RESEND_API_KEY"
    "CRON_SECRET"
    "OPENAI_API_KEY"
)

for var in "${VARS[@]}"; do
    # Read value from .env.local
    value=$(grep "^${var}=" .env.local 2>/dev/null | cut -d '=' -f2- | tr -d '"' | tr -d "'" || echo "")
    
    if [ -n "$value" ]; then
        echo "  ✓ Syncing $var..."
        echo "$value" | vercel env add "$var" production --yes --force 2>/dev/null || {
            echo "    ⚠️  $var may already exist, updating..."
            # Remove old value and add new one
            vercel env rm "$var" production --yes 2>/dev/null || true
            echo "$value" | vercel env add "$var" production --yes 2>/dev/null || echo "    ❌ Failed to sync $var"
        }
    else
        echo "  ⏭️  Skipping $var (not in .env.local)"
    fi
done

echo ""
echo "✅ Sync complete!"
echo ""
echo "📝 Note: NEXT_PUBLIC_* variables should be set manually in Vercel Dashboard"
echo "   as they need to be available at build time."

