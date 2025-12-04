#!/bin/bash
# Test 5.2: Day 2 Micro Mode Activation - Run Cron Job and Generate Plan
# This script triggers the streak recovery cron job and then generates a daily plan

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

echo "🚀 Test 5.2: Day 2 Micro Mode Activation"
echo "========================================"
echo ""
echo "📋 Prerequisites:"
echo "   1. User should be set to 2 days inactive (run test_streak_day2_setup.sql)"
echo "   2. User should NOT have day2_detected in metadata yet"
echo ""
read -p "Press Enter to continue..."

echo ""
echo "🚀 Step 1: Triggering streak recovery cron job..."
echo ""

# Run against production
URL="https://nextbestmove.app/api/cron/streak-recovery?secret=$CRON_SECRET"
echo "📍 Using production URL: $URL"
echo ""

# Make the request
RESPONSE=$(curl -s -X GET "$URL")

# Pretty print JSON response
echo "📤 Cron Job Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Expected results:"
echo "   - day2MicroModeDetected: 1"
echo "   - processed: 1 (or more if other users match)"
echo ""
echo "📋 Next steps:"
echo "   1. Generate a daily plan (Micro Mode should be applied)"
echo "   2. Run test_streak_day2_verify.sql to check:"
echo "      - Metadata was updated (day2_detected: true)"
echo "      - Plan was generated with capacity_level = 'micro'"
echo "      - Plan has adaptive_reason = 'streak_break'"
echo "      - Plan has exactly 2 actions"
echo ""
echo "💡 Note: To generate the plan, you'll need to:"
echo "   - Log in to the app as the test user"
echo "   - Navigate to /app/plan"
echo "   - Or use the API endpoint: POST /api/daily-plans/generate"

