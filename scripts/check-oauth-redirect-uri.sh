#!/bin/bash

echo "🔍 Checking OAuth Redirect URI Configuration"
echo "=============================================="
echo ""

# Load environment variables
if [ -f web/.env.local ]; then
  source web/.env.local
elif [ -f .env.local ]; then
  source .env.local
fi

GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-"https://nextbestmove.app"}

if [ -z "$GOOGLE_CLIENT_ID" ]; then
  echo "❌ GOOGLE_CLIENT_ID not found in environment"
  echo "   Please check .env.local or Vercel environment variables"
  exit 1
fi

echo "✅ Client ID: ${GOOGLE_CLIENT_ID:0:40}..."
echo ""

# Expected redirect URIs
PRODUCTION_URI="${NEXT_PUBLIC_APP_URL}/api/calendar/callback/google"
LOCAL_URI="http://localhost:3000/api/calendar/callback/google"

echo "📋 Expected Redirect URIs:"
echo "   Production: $PRODUCTION_URI"
echo "   Local:       $LOCAL_URI"
echo ""

echo "⚠️  ACTION REQUIRED:"
echo "   1. Go to Google Cloud Console:"
echo "      https://console.cloud.google.com/apis/credentials"
echo ""
echo "   2. Find OAuth client: ${GOOGLE_CLIENT_ID:0:40}..."
echo ""
echo "   3. Click to edit the client"
echo ""
echo "   4. In 'Authorized redirect URIs', ensure these are added:"
echo "      - $PRODUCTION_URI"
echo "      - $LOCAL_URI"
echo ""
echo "   5. Click SAVE"
echo ""
echo "   6. Wait 1-2 minutes for changes to propagate"
echo ""
echo "   7. Try connecting calendar again"
echo ""

# Test if we can construct the authorization URL
echo "🔗 Authorization URL would be:"
AUTH_URL="https://accounts.google.com/o/oauth2/v2/auth?client_id=$GOOGLE_CLIENT_ID&redirect_uri=$PRODUCTION_URI&response_type=code&scope=openid%20email%20https://www.googleapis.com/auth/calendar.readonly&access_type=offline&prompt=select_account%20consent"
echo "$AUTH_URL"
echo ""

echo "💡 If redirect URI is missing or incorrect, Google will return 'invalid_client'"
echo ""

