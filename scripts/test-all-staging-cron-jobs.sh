#!/bin/bash

# Test all staging cron jobs
# Usage: ./scripts/test-all-staging-cron-jobs.sh [STAGING_CRON_SECRET]

if [ -z "$1" ]; then
  echo "❌ Error: Staging CRON_SECRET required"
  echo "Usage: ./scripts/test-all-staging-cron-jobs.sh YOUR_STAGING_CRON_SECRET"
  exit 1
fi

STAGING_CRON_SECRET="$1"
STAGING_URL="https://staging.nextbestmove.app"
STAGING_USER="staging"
STAGING_PASS="Jer29:11esv"

echo "🧪 Testing all staging cron jobs..."
echo "   Staging URL: $STAGING_URL"
echo "   CRON_SECRET: ${STAGING_CRON_SECRET:0:10}..."
echo ""

# Array of cron endpoints
declare -a CRON_ENDPOINTS=(
  "cron/daily-plans"
  "cron/weekly-summaries"
  "cron/streak-recovery"
  "cron/payment-failure-recovery"
  "cron/win-back-campaign"
  "cron/trial-reminders"
  "cron/auto-unsnooze"
  "cron/auto-archive"
  "cron/aggregate-performance-timeline"
  "notifications/morning-plan"
  "notifications/fast-win-reminder"
  "notifications/follow-up-alerts"
)

SUCCESS_COUNT=0
FAIL_COUNT=0

for endpoint in "${CRON_ENDPOINTS[@]}"; do
  echo "Testing: $endpoint"
  
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
    "${STAGING_URL}/api/${endpoint}?secret=${STAGING_CRON_SECRET}" \
    -u "${STAGING_USER}:${STAGING_PASS}" \
    -H "Content-Type: application/json")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ Success (HTTP $HTTP_CODE)"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "  ❌ Failed (HTTP $HTTP_CODE)"
    echo "  Response: $(echo "$BODY" | head -3)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  echo ""
done

echo "📊 Test Summary:"
echo "   ✅ Success: $SUCCESS_COUNT"
echo "   ❌ Failed: $FAIL_COUNT"
echo "   📋 Total: ${#CRON_ENDPOINTS[@]}"

if [ $FAIL_COUNT -eq 0 ]; then
  echo ""
  echo "✅ All cron jobs are working!"
  exit 0
else
  echo ""
  echo "⚠️  Some cron jobs failed. Check the errors above."
  exit 1
fi

