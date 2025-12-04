#!/bin/bash

# Quick test script for /api/leads endpoints
# Usage: ./test_api_endpoints.sh [base_url]
# Example: ./test_api_endpoints.sh http://localhost:3000

BASE_URL="${1:-http://localhost:3000}"

echo "🧪 Testing /api/leads endpoints..."
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: GET /api/leads
echo "Test 1: GET /api/leads"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/leads" \
  -H "Content-Type: application/json")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ] || [ "$http_code" = "401" ]; then
  if echo "$body" | grep -q '"leads"'; then
    echo -e "${GREEN}✅ PASS: Response contains 'leads' property${NC}"
  else
    echo -e "${YELLOW}⚠️  WARNING: Response doesn't contain 'leads' property${NC}"
    echo "Response: $body"
  fi
else
  echo -e "${RED}❌ FAIL: HTTP $http_code${NC}"
  echo "Response: $body"
fi
echo ""

# Test 2: GET /api/billing/check-lead-limit
echo "Test 2: GET /api/billing/check-lead-limit"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/billing/check-lead-limit" \
  -H "Content-Type: application/json")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ] || [ "$http_code" = "401" ]; then
  if echo "$body" | grep -q '"canAdd"'; then
    echo -e "${GREEN}✅ PASS: Response contains limit info${NC}"
    echo "Response: $body"
  else
    echo -e "${YELLOW}⚠️  WARNING: Response format unexpected${NC}"
    echo "Response: $body"
  fi
else
  echo -e "${RED}❌ FAIL: HTTP $http_code${NC}"
  echo "Response: $body"
fi
echo ""

# Test 3: POST /api/leads (will fail without auth, but checks route exists)
echo "Test 3: POST /api/leads (route check)"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/leads" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","url":"https://example.com"}')
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "401" ] || [ "$http_code" = "400" ] || [ "$http_code" = "201" ]; then
  echo -e "${GREEN}✅ PASS: Route exists (HTTP $http_code)${NC}"
else
  echo -e "${RED}❌ FAIL: Unexpected HTTP $http_code${NC}"
fi
echo ""

echo "📝 Note: Full testing requires authentication."
echo "   Use the browser console script in the test guide for authenticated tests."

