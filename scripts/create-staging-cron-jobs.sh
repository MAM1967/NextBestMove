#!/bin/bash

# Script to create remaining staging cron jobs via cron-job.org API
# Usage: ./scripts/create-staging-cron-jobs.sh [STAGING_CRON_SECRET]

set -e

if [ -z "$1" ]; then
  echo "❌ Error: Staging CRON_SECRET required"
  echo "Usage: ./scripts/create-staging-cron-jobs.sh YOUR_STAGING_CRON_SECRET"
  exit 1
fi

STAGING_CRON_SECRET="$1"
API_KEY="tA4auCiGFs4DIVKM01ho5xJhKHyzR2XLgB8SEzaitOk="
STAGING_URL="https://staging.nextbestmove.app"
API_ENDPOINT="https://api.cron-job.org/jobs"

echo "🚀 Creating staging cron jobs via cron-job.org API..."
echo "   Staging URL: $STAGING_URL"
echo "   API Key: ${API_KEY:0:10}..."
echo ""

# Function to create a cron job
create_job() {
  local title="$1"
  local endpoint="$2"
  local hours="$3"
  local minutes="$4"
  local wdays="$5"  # -1 for all days, or [0,1,2,3,4,5,6] for specific days (0=Sunday)
  
  local url="${STAGING_URL}${endpoint}?secret=${STAGING_CRON_SECRET}"
  
  # Build schedule JSON
  local schedule_json="{
    \"timezone\": \"UTC\",
    \"hours\": [$hours],
    \"mdays\": [-1],
    \"minutes\": [$minutes],
    \"months\": [-1],
    \"wdays\": [$wdays]
  }"
  
  # Build full job JSON
  local job_json="{
    \"job\": {
      \"url\": \"$url\",
      \"enabled\": true,
      \"title\": \"$title\",
      \"saveResponses\": false,
      \"schedule\": $schedule_json
    }
  }"
  
  echo "Creating: $title"
  echo "  URL: $url"
  
  local response=$(curl -s -w "\n%{http_code}" -X PUT \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "$job_json" \
    "$API_ENDPOINT")
  
  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo "  ✅ Success (HTTP $http_code)"
    echo ""
    # Add delay to avoid rate limiting (429 errors)
    sleep 5
    return 0
  else
    echo "  ❌ Failed (HTTP $http_code)"
    if [ "$http_code" = "429" ]; then
      echo "  ⚠️  Rate limited - waiting 15 seconds before continuing..."
      sleep 15
    else
      echo "  Response: $body"
      sleep 2
    fi
    echo ""
    return 1
  fi
}

SUCCESS_COUNT=0
FAIL_COUNT=0

# Payment Failure Recovery - Daily at 9 AM UTC
create_job "[STAGING] Payment Failure Recovery" \
  "/api/cron/payment-failure-recovery" \
  9 \
  0 \
  -1
if [ $? -eq 0 ]; then SUCCESS_COUNT=$((SUCCESS_COUNT + 1)); else FAIL_COUNT=$((FAIL_COUNT + 1)); fi

# Win-Back Campaign - Daily at 10 AM UTC
create_job "[STAGING] Win-Back Campaign" \
  "/api/cron/win-back-campaign" \
  10 \
  0 \
  -1
if [ $? -eq 0 ]; then SUCCESS_COUNT=$((SUCCESS_COUNT + 1)); else FAIL_COUNT=$((FAIL_COUNT + 1)); fi

# Trial Reminders - Daily at 11 AM UTC
create_job "[STAGING] Trial Reminders" \
  "/api/cron/trial-reminders" \
  11 \
  0 \
  -1
if [ $? -eq 0 ]; then SUCCESS_COUNT=$((SUCCESS_COUNT + 1)); else FAIL_COUNT=$((FAIL_COUNT + 1)); fi

# Auto-Unsnooze - Daily at 12 PM UTC
create_job "[STAGING] Auto-Unsnooze" \
  "/api/cron/auto-unsnooze" \
  12 \
  0 \
  -1
if [ $? -eq 0 ]; then SUCCESS_COUNT=$((SUCCESS_COUNT + 1)); else FAIL_COUNT=$((FAIL_COUNT + 1)); fi

# Auto-Archive - Daily at 1 PM UTC
create_job "[STAGING] Auto-Archive" \
  "/api/cron/auto-archive" \
  13 \
  0 \
  -1
if [ $? -eq 0 ]; then SUCCESS_COUNT=$((SUCCESS_COUNT + 1)); else FAIL_COUNT=$((FAIL_COUNT + 1)); fi

# Performance Timeline - Daily at 2 PM UTC
create_job "[STAGING] Performance Timeline" \
  "/api/cron/aggregate-performance-timeline" \
  14 \
  0 \
  -1
if [ $? -eq 0 ]; then SUCCESS_COUNT=$((SUCCESS_COUNT + 1)); else FAIL_COUNT=$((FAIL_COUNT + 1)); fi

# Morning Plan Email - Daily at 8 AM UTC
create_job "[STAGING] Morning Plan Email" \
  "/api/notifications/morning-plan" \
  8 \
  0 \
  -1
if [ $? -eq 0 ]; then SUCCESS_COUNT=$((SUCCESS_COUNT + 1)); else FAIL_COUNT=$((FAIL_COUNT + 1)); fi

# Fast Win Reminder - Daily at 2 PM UTC
create_job "[STAGING] Fast Win Reminder" \
  "/api/notifications/fast-win-reminder" \
  14 \
  0 \
  -1
if [ $? -eq 0 ]; then SUCCESS_COUNT=$((SUCCESS_COUNT + 1)); else FAIL_COUNT=$((FAIL_COUNT + 1)); fi

# Follow-Up Alerts - Daily at 3 PM UTC
create_job "[STAGING] Follow-Up Alerts" \
  "/api/notifications/follow-up-alerts" \
  15 \
  0 \
  -1
if [ $? -eq 0 ]; then SUCCESS_COUNT=$((SUCCESS_COUNT + 1)); else FAIL_COUNT=$((FAIL_COUNT + 1)); fi

echo "📊 Summary:"
echo "   ✅ Success: $SUCCESS_COUNT"
echo "   ❌ Failed: $FAIL_COUNT"
echo "   📋 Total: 9"

if [ $FAIL_COUNT -eq 0 ]; then
  echo ""
  echo "✅ All staging cron jobs created successfully!"
  exit 0
else
  echo ""
  echo "⚠️  Some cron jobs failed to create. Check the errors above."
  exit 1
fi

