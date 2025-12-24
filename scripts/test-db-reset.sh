#!/bin/bash

# Database Reset & Seed Script for Testing
# This script resets test data in the staging Supabase database
# Usage: ./scripts/test-db-reset.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Resetting test database...${NC}"

# Check for required environment variables
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set${NC}"
  echo "Please set it in your environment or .env.local"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo -e "${RED}❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set${NC}"
  echo "Please set it in your environment or .env.local"
  exit 1
fi

# Extract project reference from URL
PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|')
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

echo -e "${YELLOW}📋 Project: ${PROJECT_REF}${NC}"
echo -e "${YELLOW}🔗 URL: ${SUPABASE_URL}${NC}"

# SQL to clean up test data
# Pattern: test+*@* or playwright+*@* or test-*@staging.nextbestmove.app
CLEANUP_SQL=$(cat <<EOF
-- Delete test users (by email pattern)
DELETE FROM auth.users 
WHERE email LIKE 'test+%@%' 
   OR email LIKE 'playwright+%@%'
   OR email LIKE 'test-%@staging.nextbestmove.app'
   OR email LIKE 'vitest+%@%';

-- Note: This will cascade delete related data in:
-- - users table (via foreign key)
-- - leads table (via user_id)
-- - actions table (via lead_id)
-- - calendar_connections table (via user_id)
-- - subscriptions table (via user_id)
EOF
)

echo -e "${YELLOW}🧹 Cleaning up test users...${NC}"

# Execute cleanup via Supabase REST API
RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${CLEANUP_SQL}\"}" || echo "{}")

# Alternative: Use psql if available (more reliable)
if command -v psql &> /dev/null; then
  echo -e "${YELLOW}📝 Using psql for cleanup...${NC}"
  
  # Extract connection details from URL
  # Note: This requires SUPABASE_DB_PASSWORD to be set
  if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_DB_PASSWORD not set, skipping psql cleanup${NC}"
    echo -e "${YELLOW}💡 Using REST API cleanup instead${NC}"
  else
    PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
      -h "${PROJECT_REF}.supabase.co" \
      -p 5432 \
      -U postgres \
      -d postgres \
      -c "$CLEANUP_SQL" || echo -e "${YELLOW}⚠️  psql cleanup failed, continuing...${NC}"
  fi
fi

echo -e "${GREEN}✅ Test database cleanup complete${NC}"
echo -e "${YELLOW}💡 Note: Seed data should be created by individual tests${NC}"
echo -e "${YELLOW}💡 See tests/fixtures/ for example seed data${NC}"

