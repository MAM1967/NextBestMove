#!/bin/bash
# Staging Supabase Setup Helper Script
# This script helps apply all migrations to a staging Supabase project

set -e

echo "🚀 Staging Supabase Setup Helper"
echo "=================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "   Install it: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "supabase/migrations" ]; then
    echo "❌ Error: supabase/migrations directory not found."
    echo "   Please run this script from the project root."
    exit 1
fi

echo "📋 Migration files found:"
echo ""

# List all migrations in order
MIGRATIONS=$(ls -1 supabase/migrations/*.sql | sort)

COUNT=0
for migration in $MIGRATIONS; do
    COUNT=$((COUNT + 1))
    filename=$(basename "$migration")
    echo "  $COUNT. $filename"
done

echo ""
echo "Total migrations: $COUNT"
echo ""

# Check if project is linked
echo "🔗 Checking Supabase project link..."
if supabase projects list &> /dev/null; then
    echo "✅ Supabase CLI is configured"
    
    # Try to get current project
    CURRENT_PROJECT=$(supabase status 2>/dev/null | grep "Project ID" | awk '{print $3}' || echo "")
    
    if [ -n "$CURRENT_PROJECT" ]; then
        echo "📌 Current project: $CURRENT_PROJECT"
        echo ""
        read -p "Is this your STAGING project? (y/n): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            echo "⚠️  Please link to your staging project first:"
            echo "   supabase link --project-ref <staging-project-ref>"
            exit 1
        fi
    else
        echo "⚠️  No project linked. Please link to staging project:"
        echo "   supabase link --project-ref <staging-project-ref>"
        exit 1
    fi
else
    echo "⚠️  Could not verify Supabase CLI connection"
    echo "   Make sure you're logged in: supabase login"
    exit 1
fi

echo ""
echo "🚀 Ready to apply migrations to staging project"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "📤 Pushing migrations to staging..."
echo ""

# Apply migrations
if supabase db push; then
    echo ""
    echo "✅ Migrations applied successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Verify migrations in Supabase Dashboard → Database → Migrations"
    echo "   2. Configure auth settings (see docs/Planning/Staging_Supabase_Setup_Guide.md)"
    echo "   3. Create test users"
    echo "   4. Move to Phase 1.3: Vercel Configuration"
else
    echo ""
    echo "❌ Migration failed. Check the error messages above."
    exit 1
fi

