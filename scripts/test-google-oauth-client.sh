#!/bin/bash

# Test Google OAuth Client Credentials
# This script tests if the Google OAuth client ID and secret are valid

set -e

echo "🔍 Testing Google OAuth Client Credentials"
echo "=========================================="
echo ""

# Load environment variables
if [ -f "web/.env.local" ]; then
    source web/.env.local
    echo "✅ Loaded .env.local"
else
    echo "⚠️  No .env.local found, using environment variables"
fi

# Check if variables are set
if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "❌ GOOGLE_CLIENT_ID is not set"
    exit 1
fi

if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ GOOGLE_CLIENT_SECRET is not set"
    exit 1
fi

echo "✅ Client ID: ${GOOGLE_CLIENT_ID:0:30}..."
echo "✅ Client Secret: ${GOOGLE_CLIENT_SECRET:0:10}..."
echo ""

# Test 1: Check Google OAuth Discovery Endpoint
echo "📡 Test 1: Checking Google OAuth Discovery Endpoint..."
DISCOVERY_RESPONSE=$(curl -s "https://accounts.google.com/.well-known/openid-configuration")
if echo "$DISCOVERY_RESPONSE" | grep -q "authorization_endpoint"; then
    echo "✅ Discovery endpoint is accessible"
    TOKEN_ENDPOINT=$(echo "$DISCOVERY_RESPONSE" | grep -o '"token_endpoint":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$TOKEN_ENDPOINT" ]; then
        # Fallback: use known Google token endpoint
        TOKEN_ENDPOINT="https://oauth2.googleapis.com/token"
    fi
    echo "   Token endpoint: $TOKEN_ENDPOINT"
else
    echo "❌ Failed to get discovery document"
    exit 1
fi

echo ""

# Test 2: Try to refresh a token with invalid refresh token (to test client credentials)
# This will fail with invalid_grant (expected), but if client is invalid, we get invalid_client
echo "📡 Test 2: Testing client credentials with token endpoint..."
TOKEN_RESPONSE=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=invalid_refresh_token_for_testing" \
  -d "client_id=$GOOGLE_CLIENT_ID" \
  -d "client_secret=$GOOGLE_CLIENT_SECRET")

echo "Response: $TOKEN_RESPONSE"
echo ""

# Parse response
if echo "$TOKEN_RESPONSE" | grep -q "invalid_client"; then
    echo "❌ ERROR: invalid_client - The OAuth client was not found"
    echo ""
    echo "This means Google doesn't recognize your client ID."
    echo "Possible causes:"
    echo "  1. Client ID is incorrect"
    echo "  2. Client was deleted in Google Cloud Console"
    echo "  3. Client is disabled"
    echo "  4. Wrong Google Cloud project"
    exit 1
elif echo "$TOKEN_RESPONSE" | grep -q "invalid_grant"; then
    echo "✅ Client credentials are VALID!"
    echo "   (invalid_grant is expected - we used a fake refresh token)"
    echo ""
    echo "The client exists and credentials are correct."
    echo "The issue is likely with the refresh token in your database."
    echo "Solution: Disconnect and reconnect the calendar."
    exit 0
elif echo "$TOKEN_RESPONSE" | grep -q "invalid_request"; then
    echo "⚠️  Got invalid_request - may need to check request format"
    echo "$TOKEN_RESPONSE"
    exit 1
else
    echo "⚠️  Unexpected response:"
    echo "$TOKEN_RESPONSE"
    exit 1
fi

