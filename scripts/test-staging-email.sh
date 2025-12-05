#!/bin/bash

# Test email sending from staging
# Usage: ./scripts/test-staging-email.sh YOUR_EMAIL@example.com

if [ -z "$1" ]; then
  echo "❌ Error: Email address required"
  echo "Usage: ./scripts/test-staging-email.sh YOUR_EMAIL@example.com"
  exit 1
fi

EMAIL="$1"
STAGING_URL="https://staging.nextbestmove.app"
STAGING_USER="staging"
STAGING_PASS="Jer29:11esv"

echo "📧 Sending test email from staging..."
echo "   To: $EMAIL"
echo "   From: noreply@staging.nextbestmove.app"
echo "   Subject: [STAGING] Reset your NextBestMove password"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "${STAGING_URL}/api/test-email?to=${EMAIL}" \
  -u "${STAGING_USER}:${STAGING_PASS}" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Email sent successfully!"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ Failed to send email (HTTP $HTTP_CODE)"
  echo "$BODY"
  exit 1
fi

