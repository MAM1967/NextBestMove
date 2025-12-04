#!/bin/bash

# Test 5.6: Day 7 Deduplication Test
# This verifies that notifications aren't sent multiple times for the same day

# Load CRON_SECRET from env file
if [ -f .env.local ]; then
  export CRON_SECRET=$(grep "^CRON_SECRET=" .env.local | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

# Debug: Check if CRON_SECRET is set (first 10 chars only for security)
if [ -z "$CRON_SECRET" ]; then
  echo "⚠️  WARNING: CRON_SECRET is not set!"
  exit 1
fi

echo "🧪 Test 5.6: Day 7 Deduplication"
echo "================================"
echo ""

# Step 1: Check initial state
echo "📊 Step 1: Checking initial state..."
echo "User should be 7 days inactive with empty metadata"
echo ""

# Step 2: Run cron job FIRST time
echo "🔄 Step 2: Running cron job (FIRST time - should send Day 7 email)..."
echo ""

RESPONSE1=$(curl -X GET "https://nextbestmove.app/api/cron/streak-recovery?secret=${CRON_SECRET}" \
  2>/dev/null)

echo "Response 1:"
echo "$RESPONSE1" | jq '.' 2>/dev/null || echo "$RESPONSE1"
echo ""

# Wait a moment for processing
sleep 2

# Step 3: Verify metadata was updated
echo "✅ Step 3: Verifying metadata was updated..."
echo "Expected: last_day should be 7, day7_sent should be true"
echo ""

# Step 4: Run cron job SECOND time (should skip)
echo "🔄 Step 4: Running cron job (SECOND time - should SKIP due to deduplication)..."
echo ""

RESPONSE2=$(curl -X GET "https://nextbestmove.app/api/cron/streak-recovery?secret=${CRON_SECRET}" \
  2>/dev/null)

echo "Response 2:"
echo "$RESPONSE2" | jq '.' 2>/dev/null || echo "$RESPONSE2"
echo ""

# Step 5: Verify no duplicate was sent
echo "✅ Step 5: Verifying no duplicate notification..."
echo "Expected: day7PushNotifications should be 0 in second response"
echo ""

echo "📋 Summary:"
echo "- First run: Should send Day 7 email (day7PushNotifications: 1)"
echo "- Second run: Should skip (day7PushNotifications: 0)"
echo "- Metadata should show last_day: 7 after first run"
echo ""

