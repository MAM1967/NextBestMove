#!/bin/bash
# Test 1: Day 1 Streak Break Detection - Run Cron Job
# This script triggers the streak recovery cron job

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

echo "🚀 Triggering streak recovery cron job..."
echo ""

# Run locally (if dev server is running)
if [ "$1" == "local" ]; then
  URL="http://localhost:3000/api/cron/streak-recovery?secret=$CRON_SECRET"
  echo "📍 Using local URL: $URL"
else
  # Production URL
  URL="https://nextbestmove.app/api/cron/streak-recovery?secret=$CRON_SECRET"
  echo "📍 Using production URL: $URL"
fi

echo ""
echo "📤 Sending request..."
echo ""

# Make the request
RESPONSE=$(curl -s -X GET "$URL")

# Pretty print JSON response
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Done! Check the response above."
echo ""
echo "Expected response should show:"
echo "  - day1PushNotifications: 1"
echo "  - processed: 1"
echo ""
echo "Next step: Run test_streak_day1_verify.sql to check metadata was updated"

