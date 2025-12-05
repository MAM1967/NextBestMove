#!/bin/bash
# Apply initial schema first, then continue with migrations

echo "📋 Applying initial schema first..."
echo ""
echo "Please do this manually:"
echo ""
echo "1. Cancel the current migration (Ctrl+C if still running)"
echo ""
echo "2. Go to Supabase SQL Editor:"
echo "   https://supabase.com/dashboard/project/adgiptzbxnzddbgfeuut/sql/new"
echo ""
echo "3. Copy the contents of: supabase/migrations/202511260001_initial_schema.sql"
echo "   and paste it into the SQL Editor, then click 'Run'"
echo ""
echo "4. After the initial schema is applied, run:"
echo "   supabase db push"
echo "   (It will skip the initial schema and apply the rest)"
echo ""

