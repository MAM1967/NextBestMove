#!/bin/bash
# Helper script to set environment variables for Playwright tests
# These match the Vercel Preview scope variable names

# Supabase credentials (from Vercel Preview scope)
# These are the staging Supabase project credentials
export NEXT_PUBLIC_SUPABASE_URL="https://adgiptzbxnzddbgfeuut.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2lwdHpieG56ZGRiZ2ZldXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg3OTQzMiwiZXhwIjoyMDgwNDU1NDMyfQ.-JUP_rXGxxxyv6Rk0ThtCZYZou_d33zuGJU33xy6eoo"

# Basic Auth credentials (defaults, can be overridden)
export STAGING_USER="${STAGING_USER:-staging}"
export STAGING_PASS="${STAGING_PASS:-Jer29:11esv}"

# Cron secret (optional, for weekly summary test)
# export CRON_SECRET="your-cron-secret"

echo "✅ Environment variables set for Playwright tests"
echo "   NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:30}..."
echo "   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:30}..."
echo "   STAGING_USER: ${STAGING_USER}"
echo ""
echo "Run tests with: npm run test:staging"

