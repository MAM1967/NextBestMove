#!/bin/bash

echo "🔍 Testing New Google OAuth Client Credentials"
echo "=============================================="
echo ""

# Load credentials from environment or .env.local
if [ -f web/.env.local ]; then
  source web/.env.local
elif [ -f .env.local ]; then
  source .env.local
fi

GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

echo "✅ Client ID: ${GOOGLE_CLIENT_ID:0:50}..."
echo "✅ Client Secret: ${GOOGLE_CLIENT_SECRET:0:20}..."
echo ""

# Test 1: Discover Google's OAuth endpoints
echo "📡 Test 1: Checking Google OAuth Discovery Endpoint..."
DISCOVERY_URL="https://accounts.google.com/.well-known/openid-configuration"
DISCOVERY_RESPONSE=$(curl -s "$DISCOVERY_URL")

if [ $? -ne 0 ]; then
  echo "❌ Failed to reach Google Discovery Endpoint."
  exit 1
fi

TOKEN_ENDPOINT=$(echo "$DISCOVERY_RESPONSE" | jq -r '.token_endpoint')
AUTH_ENDPOINT=$(echo "$DISCOVERY_RESPONSE" | jq -r '.authorization_endpoint')

echo "✅ Discovery endpoint is accessible"
echo "   Token endpoint: $TOKEN_ENDPOINT"
echo "   Authorization endpoint: $AUTH_ENDPOINT"
echo ""

# Test 2: Test client credentials with token endpoint
echo "📡 Test 2: Testing client credentials..."
TOKEN_RESPONSE=$(curl -s -X POST "$TOKEN_ENDPOINT" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=fake_refresh_token" \
  -d "client_id=$GOOGLE_CLIENT_ID" \
  -d "client_secret=$GOOGLE_CLIENT_SECRET")

echo "Response: $TOKEN_RESPONSE"
echo ""

if echo "$TOKEN_RESPONSE" | grep -q "invalid_client"; then
  echo "❌ Client credentials are INVALID! Google reports 'invalid_client'."
  echo "   Check that the client ID and secret are correct in Google Cloud Console."
  exit 1
elif echo "$TOKEN_RESPONSE" | grep -q "invalid_grant"; then
  echo "✅ Client credentials are VALID!"
  echo "   (invalid_grant is expected - we used a fake refresh token)"
else
  echo "⚠️  Unexpected response. Could not verify client credentials."
  echo "Response: $TOKEN_RESPONSE"
fi

echo ""
echo "📋 IMPORTANT: Verify in Google Cloud Console:"
echo "   1. Go to: https://console.cloud.google.com/apis/credentials"
echo "   2. Find OAuth client: ${GOOGLE_CLIENT_ID:0:50}..."
echo "   3. Check 'Authorized redirect URIs' includes:"
echo "      - https://nextbestmove.app/api/calendar/callback/google"
echo "      - http://localhost:3000/api/calendar/callback/google"
echo "   4. Check OAuth consent screen has test user: mcddsl@gmail.com"
echo ""
