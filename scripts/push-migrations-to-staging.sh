#!/bin/bash
# Push migrations to staging Supabase using service role key
# This script applies all migrations via the Supabase REST API or direct SQL

set -e

PROJECT_REF="adgiptzbxnzddbgfeuut"
PROJECT_URL="https://${PROJECT_REF}.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2lwdHpieG56ZGRiZ2ZldXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg3OTQzMiwiZXhwIjoyMDgwNDU1NDMyfQ.-JUP_rXGxxxyv6Rk0ThtCZYZou_d33zuGJU33xy6eoo"

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

