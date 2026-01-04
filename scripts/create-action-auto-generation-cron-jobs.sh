#!/bin/bash

# Script to create action auto-generation cron jobs via cron-job.org API
# Usage: ./scripts/create-action-auto-generation-cron-jobs.sh [CRON_SECRET] [ENVIRONMENT]
#   ENVIRONMENT: staging (default) or production

set -e

if [ -z "$1" ]; then
  echo "❌ Error: CRON_SECRET required"
  echo "Usage: ./scripts/create-action-auto-generation-cron-jobs.sh YOUR_CRON_SECRET [staging|production]"
  exit 1
fi

CRON_SECRET="$1"
ENVIRONMENT="${2:-staging}"
API_KEY="tA4auCiGFs4DIVKM01ho5xJhKHyzR2XLgB8SEzaitOk="
API_ENDPOINT="https://api.cron-job.org/jobs"

if [ "$ENVIRONMENT" = "production" ]; then
  BASE_URL="https://nextbestmove.app"
  TITLE_PREFIX=""
else
  BASE_URL="https://staging.nextbestmove.app"
  TITLE_PREFIX="[STAGING] "
fi

echo "🚀 Creating action auto-generation cron jobs..."
echo "   Environment: $ENVIRONMENT"
echo "   Base URL: $BASE_URL"
echo "   API Key: ${API_KEY:0:10}..."
echo "   CRON_SECRET: ${CRON_SECRET:0:10}..."
echo ""

# Function to create a cron job
create_job() {
  local title="$1"
  local endpoint="$2"
  local schedule_type="$3"  # "hourly" or "daily"
  local hour="$4"  # For daily jobs, the hour (0-23)
  local minutes="$5"  # For daily jobs, the minutes (0-59)
  
  local url="${BASE_URL}${endpoint}?secret=${CRON_SECRET}"
  local full_title="${TITLE_PREFIX}${title}"
  
  # Build schedule JSON
  local schedule_json
  if [ "$schedule_type" = "hourly" ]; then
    # Hourly: run every hour at minute 0
    schedule_json='{
      "timezone": "UTC",
      "hours": [-1],
      "mdays": [-1],
      "minutes": [0],
      "months": [-1],
      "wdays": [-1]
    }'
  else
    # Daily: run at specific hour and minute
    schedule_json="{
      \"timezone\": \"UTC\",
      \"hours\": [$hour],
      \"mdays\": [-1],
      \"minutes\": [$minutes],
      \"months\": [-1],
      \"wdays\": [-1]
    }"
  fi
  
  # Build full job JSON with Authorization header
  local job_json=$(cat <<EOF
{
  "job": {
    "url": "$url",
    "enabled": true,
    "title": "$full_title",
    "saveResponses": false,
    "schedule": $schedule_json,
    "extendedData": {
      "headers": {
        "Authorization": "Bearer $CRON_SECRET"
      }
    }
  }
}
EOF
)
  
  echo "📝 Creating job: $full_title"
  if [ "$schedule_type" = "hourly" ]; then
    echo "   Schedule: Hourly at minute 0"
  else
    echo "   Schedule: Daily at ${hour}:${minutes} UTC"
  fi
  echo "   URL: $url"
  echo "   Authorization: Bearer ${CRON_SECRET:0:10}..."
  echo ""
  
  local response=$(curl -s -w "\n%{http_code}" -X PUT \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "$job_json" \
    "$API_ENDPOINT")
  
  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo "  ✅ Success (HTTP $http_code)"
    
    # Try to extract job ID from response
    if command -v jq &> /dev/null; then
      local job_id=$(echo "$body" | jq -r '.jobId // .job.jobId // empty' 2>/dev/null)
      if [ -n "$job_id" ] && [ "$job_id" != "null" ]; then
        echo "  Job ID: $job_id"
      fi
    fi
    
    echo ""
    # Add delay to avoid rate limiting
    sleep 3
    return 0
  else
    echo "  ❌ Failed (HTTP $http_code)"
    if [ -n "$body" ]; then
      echo "  Response: $body"
    fi
    
    if [ "$http_code" = "429" ]; then
      echo "  ⚠️  Rate limited - waiting 15 seconds before continuing..."
      sleep 15
    else
      sleep 2
    fi
    
    echo ""
    return 1
  fi
}

SUCCESS_COUNT=0
FAIL_COUNT=0

# CALL_PREP Auto-Generation - Hourly
create_job "CALL_PREP Auto-Generation" \
  "/api/cron/create-call-prep-actions" \
  "hourly" \
  0 \
  0
if [ $? -eq 0 ]; then SUCCESS_COUNT=$((SUCCESS_COUNT + 1)); else FAIL_COUNT=$((FAIL_COUNT + 1)); fi

# POST_CALL Auto-Generation - Hourly
create_job "POST_CALL Auto-Generation" \
  "/api/cron/create-post-call-actions" \
  "hourly" \
  0 \
  0
if [ $? -eq 0 ]; then SUCCESS_COUNT=$((SUCCESS_COUNT + 1)); else FAIL_COUNT=$((FAIL_COUNT + 1)); fi

# NURTURE Auto-Generation - Daily at 1 AM UTC
create_job "NURTURE Auto-Generation" \
  "/api/cron/create-nurture-actions" \
  "daily" \
  1 \
  0
if [ $? -eq 0 ]; then SUCCESS_COUNT=$((SUCCESS_COUNT + 1)); else FAIL_COUNT=$((FAIL_COUNT + 1)); fi

echo "📊 Summary:"
echo "   ✅ Success: $SUCCESS_COUNT"
echo "   ❌ Failed: $FAIL_COUNT"
echo "   📋 Total: 3"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo "✅ All action auto-generation cron jobs created successfully!"
  echo ""
  echo "🧪 Next steps:"
  echo "   1. Go to https://cron-job.org/en/members/jobs/ and verify the jobs are created"
  echo "   2. Test each job manually using 'Run now'"
  echo "   3. Verify they succeed and create actions correctly"
  echo ""
  exit 0
else
  echo "⚠️  Some cron jobs failed to create. Check the errors above."
  exit 1
fi

