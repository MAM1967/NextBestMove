#!/bin/bash
# Test 5.4: Day 7 Billing Pause Offer - Run Cron Job
# This script triggers the streak recovery cron job and checks for Day 7 email

# Set your CRON_SECRET here or export it as an environment variable
# CRON_SECRET="your-secret-here"

# Check if CRON_SECRET is set
if [ -z "$CRON_SECRET" ]; then
  echo "❌ CRON_SECRET not set. Please set it:"
  echo "   export CRON_SECRET='your-secret-here'"
  echo ""
  echo "Or edit this script and set CRON_SECRET at the top"
  exit 1
fi

echo "🚀 Test 5.4: Day 7 Billing Pause Offer"
echo "======================================"
echo ""
echo "📋 Prerequisites:"
echo "   1. User should be set to 7 days inactive (run test_streak_day7_setup.sql)"
echo "   2. User should have active/trialing subscription (check Stripe Dashboard)"
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
echo "   - day7BillingPauseOffers: 1"
echo "   - processed: 1 (or more if other users match)"
echo ""
echo "📧 Next steps:"
echo "   1. Check email inbox for: 'Pause your subscription while you're away'"
echo "   2. Run test_streak_day7_verify.sql to check metadata was updated"
echo "   3. Verify email was only sent to users with active subscriptions"
echo ""
echo "⚠️  Note: If day7BillingPauseOffers is 0, check:"
echo "   - User has active/trialing subscription (not canceled/past_due)"
echo "   - Subscription exists in billing_subscriptions table"

