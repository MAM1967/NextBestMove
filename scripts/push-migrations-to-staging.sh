#!/bin/bash
# Push migrations to staging Supabase using service role key
# This script applies all migrations via the Supabase REST API or direct SQL

set -e

PROJECT_REF="adgiptzbxnzddbgfeuut"
PROJECT_URL="https://${PROJECT_REF}.supabase.co"

# Service role key must be provided via environment variable (from Doppler)
# Never hardcode secrets in source code!
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set"
    echo ""
    echo "Please set it from Doppler:"
    echo "   export SUPABASE_SERVICE_ROLE_KEY=\$(doppler secrets get SUPABASE_SERVICE_ROLE_KEY --config stg --plain)"
    echo ""
    echo "Or add it to your .env.local file (for local development only)"
    exit 1
fi

echo "🚀 Pushing migrations to staging Supabase..."
echo "Project: $PROJECT_URL"
echo ""

# Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found"
    echo ""
    echo "⚠️  Note: supabase db push requires the database password."
    echo "   Please run this command manually and enter your password:"
    echo ""
    echo "   cd /Users/michaelmcdermott/NextBestMove"
    echo "   supabase db push"
    echo ""
    echo "   Or provide the database password to continue automatically."
    echo ""
    read -p "Do you want to continue with manual push? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Running: supabase db push"
        supabase db push
    else
        echo "Cancelled. Please run 'supabase db push' manually."
        exit 0
    fi
else
    echo "❌ Supabase CLI not found. Please install it:"
    echo "   https://supabase.com/docs/guides/cli"
    exit 1
fi

