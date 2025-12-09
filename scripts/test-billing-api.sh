#!/bin/bash
# Test billing API endpoints with proper authentication
# Usage: ./scripts/test-billing-api.sh YOUR_COOKIE_VALUE

BASE_URL="https://nextbestmove.app"
COOKIE_VALUE="$1"

if [ -z "$COOKIE_VALUE" ]; then
  echo "Usage: $0 'your-cookie-value'"
  echo ""
  echo "To get your cookie value:"
  echo "1. Log in to your app in browser"
  echo "2. Open Developer Tools → Application → Cookies"
  echo "3. Copy all cookie name=value pairs"
  echo "4. Run: $0 'cookie1=value1; cookie2=value2'"
  exit 1
fi

echo "🧪 Testing Billing API Endpoints"
echo "================================"
echo ""

echo "1. Checking environment..."
curl -s "$BASE_URL/api/check-env" | jq '.variables.STRIPE_SECRET_KEY | {mode, prefix, isLive}'

echo ""
echo "2. Creating checkout session (standard monthly)..."
curl -s -X POST "$BASE_URL/api/billing/create-checkout-session" \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE_VALUE" \
  -d '{"plan": "standard", "interval": "month", "isTrial": false}' | jq

echo ""
echo "3. Starting trial..."
curl -s -X POST "$BASE_URL/api/billing/start-trial" \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE_VALUE" \
  -d '{"plan": "standard", "interval": "month"}' | jq

echo ""
echo "4. Creating customer portal session..."
curl -s -X POST "$BASE_URL/api/billing/customer-portal" \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE_VALUE" | jq

echo ""
echo "✅ Tests complete!"

