#!/bin/bash
# Test 5.3: Day 3 Recovery Email - Run Cron Job
# This script triggers the streak recovery cron job and checks for Day 3 email

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

echo "🚀 Test 5.3: Day 3 Recovery Email"
echo "================================"
echo ""
echo "📋 Prerequisites:"
echo "   1. User should be set to 3 days inactive (run test_streak_day3_setup.sql)"
echo "   2. User should NOT have day3_sent in metadata yet"
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
echo "   - day3EmailsSent: 1"
echo "   - processed: 1 (or more if other users match)"
echo ""
echo "📧 Next steps:"
echo "   1. Check email inbox for: 'Let's get your streak back on track'"
echo "   2. Run test_streak_day3_verify.sql to check metadata was updated"
echo "   3. Verify no duplicate email if you run cron again"

