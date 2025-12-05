#!/bin/bash
# Alternative: Apply migrations via Supabase Dashboard SQL Editor
# This script lists all migrations in order for manual application

set -e

echo "📋 Migration Application Guide"
echo "=============================="
echo ""
echo "Since CLI password authentication is having issues, you can apply"
echo "migrations manually via the Supabase Dashboard SQL Editor."
echo ""
echo "Steps:"
echo "1. Go to: https://supabase.com/dashboard/project/adgiptzbxnzddbgfeuut/sql/new"
echo "2. Apply migrations in this order:"
echo ""

MIGRATIONS=$(ls -1 supabase/migrations/*.sql | sort)
COUNT=0

for migration in $MIGRATIONS; do
    COUNT=$((COUNT + 1))
    filename=$(basename "$migration")
    echo "   $COUNT. $filename"
done

echo ""
echo "Total: $COUNT migrations"
echo ""
echo "⚠️  Important: Apply them in order, starting with 202511260001_initial_schema.sql"
echo ""
echo "Alternatively, try running 'supabase db push' interactively:"
echo "   cd /Users/michaelmcdermott/NextBestMove"
echo "   supabase db push"
echo "   (Then enter password when prompted)"

