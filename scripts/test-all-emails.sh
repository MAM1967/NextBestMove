#!/bin/bash
# Test script for all email templates
# Usage: ./scripts/test-all-emails.sh YOUR_EMAIL@example.com [SECRET]

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
EMAIL="${1:-}"
SECRET="${2:-${CRON_SECRET:-${TEST_ENDPOINT_SECRET:-}}}"
STAGING_URL="${STAGING_URL:-https://staging.nextbestmove.app}"

if [ -z "$EMAIL" ]; then
  echo -e "${RED}Error: Email address required${NC}"
  echo "Usage: $0 YOUR_EMAIL@example.com [SECRET]"
  echo ""
  echo "Or set environment variables:"
  echo "  export CRON_SECRET=your_secret"
  echo "  export STAGING_URL=https://staging.nextbestmove.app"
  exit 1
fi

if [ -z "$SECRET" ]; then
  echo -e "${YELLOW}Warning: No secret provided. Some endpoints may fail.${NC}"
  echo "Set CRON_SECRET or TEST_ENDPOINT_SECRET environment variable"
  echo ""
fi

echo -e "${BLUE}🧪 Testing Email Templates${NC}"
echo "=================================="
echo "Email: $EMAIL"
echo "Staging URL: $STAGING_URL"
echo ""
echo -e "${YELLOW}Note: Adding 0.7s delay between requests to respect Resend rate limits (2 req/sec)${NC}"
echo ""

# Function to test an endpoint
test_endpoint() {
  local name="$1"
  local method="$2"
  local url="$3"
  local auth="$4"
  
  echo -e "${BLUE}Testing: $name${NC}"
  
  if [ "$method" = "POST" ]; then
    if [ -n "$auth" ]; then
      response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
        -H "Authorization: Bearer $SECRET" \
        -H "Content-Type: application/json" 2>&1)
    else
      response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
        -H "Content-Type: application/json" 2>&1)
    fi
  else
    response=$(curl -s -w "\n%{http_code}" "$url" 2>&1)
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✅ Success (HTTP $http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  else
    echo -e "${RED}❌ Failed (HTTP $http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  fi
  echo ""
  
  # Rate limiting: Resend allows 2 requests per second
  # Wait 0.7 seconds between requests to stay under limit
  sleep 0.7
}

# Test endpoints
echo -e "${YELLOW}=== Transactional Emails ===${NC}"
echo ""

test_endpoint "Password Reset" \
  "POST" \
  "$STAGING_URL/api/test-email?to=$EMAIL"

if [ -n "$SECRET" ]; then
  echo -e "${YELLOW}=== Payment Failure Emails ===${NC}"
  echo ""
  
  test_endpoint "Payment Failure - Day 0" \
    "POST" \
    "$STAGING_URL/api/test/send-payment-failure-email?userEmail=$EMAIL&daysSinceFailure=0" \
    "$SECRET"
  
  test_endpoint "Payment Failure - Day 3" \
    "POST" \
    "$STAGING_URL/api/test/send-payment-failure-email?userEmail=$EMAIL&daysSinceFailure=3" \
    "$SECRET"
  
  test_endpoint "Payment Failure - Day 7" \
    "POST" \
    "$STAGING_URL/api/test/send-payment-failure-email?userEmail=$EMAIL&daysSinceFailure=7" \
    "$SECRET"
  
  echo -e "${YELLOW}=== Win-Back Campaign Emails ===${NC}"
  echo ""
  
  test_endpoint "Win-Back - Day 7" \
    "POST" \
    "$STAGING_URL/api/test/send-win-back-email?userEmail=$EMAIL&daysSinceCancellation=7" \
    "$SECRET"
  
  test_endpoint "Win-Back - Day 30" \
    "POST" \
    "$STAGING_URL/api/test/send-win-back-email?userEmail=$EMAIL&daysSinceCancellation=30" \
    "$SECRET"
  
  test_endpoint "Win-Back - Day 90" \
    "POST" \
    "$STAGING_URL/api/test/send-win-back-email?userEmail=$EMAIL&daysSinceCancellation=90" \
    "$SECRET"
  
  test_endpoint "Win-Back - Day 180" \
    "POST" \
    "$STAGING_URL/api/test/send-win-back-email?userEmail=$EMAIL&daysSinceCancellation=180" \
    "$SECRET"
else
  echo -e "${YELLOW}Skipping protected endpoints (no secret provided)${NC}"
  echo ""
fi

echo -e "${YELLOW}=== Streak & Recovery Emails ===${NC}"
echo ""

test_endpoint "Streak Recovery" \
  "GET" \
  "$STAGING_URL/api/test-streak-email?email=$EMAIL"

echo -e "${YELLOW}=== Weekly Summary Email ===${NC}"
echo ""

test_endpoint "Weekly Summary" \
  "GET" \
  "$STAGING_URL/api/test/send-weekly-review-email?email=$EMAIL"

echo ""
echo -e "${GREEN}✅ Email testing complete!${NC}"
echo ""
echo "Check your inbox ($EMAIL) for the test emails."
echo "Remember: Staging emails will have [STAGING] prefix in subject."
echo ""
echo "For detailed testing guide, see:"
echo "  docs/Testing/Email_Templates_Testing_Guide.md"

