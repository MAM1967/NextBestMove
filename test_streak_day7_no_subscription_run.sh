#!/bin/bash
# Test 5.5: Day 7 Skip (No Subscription) - Run Cron Job
# This script triggers the streak recovery cron job and verifies NO email is sent

# Load CRON_SECRET from environment or env file
if [ -z "$CRON_SECRET" ]; then
  if [ -f .env.local ]; then
    export CRON_SECRET=$(grep "^CRON_SECRET=" .env.local | cut -d '=' -f2- | tr -d '"' | tr -d "'")
  fi
fi

# Check if CRON_SECRET is set
if [ -z "$CRON_SECRET" ]; then
  echo "⚠️  WARNING: CRON_SECRET is not set!"
  exit 1
fi

echo "🚀 Test 5.5: Day 7 Skip (No Subscription)"
echo "=========================================="
echo ""
echo "📋 Prerequisites:"
echo "   1. User should be set to 7 days inactive (run test_streak_day7_no_subscription_setup.sql)"
echo "   2. User should NOT have active/trialing subscription"
echo "   3. User should NOT have day7_sent in metadata yet"
echo ""
read -p "Press Enter to continue..."

echo ""
echo "🚀 Triggering streak recovery cron job..."
echo ""

# Run against production
URL="https://nextbestmove.app/api/cron/streak-recovery?secret=$CRON_SECRET"
echo "📍 Using production URL: $URL"
echo ""

# Make the request
RESPONSE=$(curl -s -X GET "$URL")

# Pretty print JSON response
echo "📤 Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Expected results:"
echo "   - day7BillingPauseOffers: 0 (NO email sent)"
echo "   - processed: 1 (or more if other users match)"
echo ""
echo "📧 Next steps:"
echo "   1. Verify NO email was sent (check inbox - should be empty)"
echo "   2. Run test_streak_day7_no_subscription_verify.sql to check metadata was NOT updated"
echo "   3. Verify day7_sent is NULL in metadata"
echo ""
echo "⚠️  Note: If day7BillingPauseOffers is > 0, check:"
echo "   - User subscription status (should be canceled/past_due/null, not active/trialing)"
echo "   - Subscription exists in billing_subscriptions table"

