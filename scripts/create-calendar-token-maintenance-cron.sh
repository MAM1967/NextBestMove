#!/bin/bash

# Script to create calendar token maintenance cron job via cron-job.org API
# Usage: ./scripts/create-calendar-token-maintenance-cron.sh [CRON_SECRET] [ENVIRONMENT]
#   ENVIRONMENT: staging (default) or production

set -e

if [ -z "$1" ]; then
  echo "❌ Error: CRON_SECRET required"
  echo "Usage: ./scripts/create-calendar-token-maintenance-cron.sh YOUR_CRON_SECRET [staging|production]"
  exit 1
fi

CRON_SECRET="$1"
ENVIRONMENT="${2:-staging}"
API_KEY="tA4auCiGFs4DIVKM01ho5xJhKHyzR2XLgB8SEzaitOk="
API_ENDPOINT="https://api.cron-job.org/jobs"

if [ "$ENVIRONMENT" = "production" ]; then
  BASE_URL="https://nextbestmove.app"
  TITLE="Calendar Token Maintenance"
else
  BASE_URL="https://staging.nextbestmove.app"
  TITLE="[STAGING] Calendar Token Maintenance"
fi

ENDPOINT="/api/cron/calendar-token-maintenance"
# Include query parameter as fallback (cron-job.org may not send custom headers via API)
URL="${BASE_URL}${ENDPOINT}?secret=${CRON_SECRET}"

echo "🚀 Creating calendar token maintenance cron job..."
echo "   Environment: $ENVIRONMENT"
echo "   URL: $URL"
echo "   API Key: ${API_KEY:0:10}..."
echo "   CRON_SECRET: ${CRON_SECRET:0:10}..."
echo ""

# Build schedule JSON (Daily at 2 AM UTC)
# Schedule: hours=[2], minutes=[0], mdays=[-1] (all days), months=[-1] (all months), wdays=[-1] (all weekdays)
SCHEDULE_JSON='{
  "timezone": "UTC",
  "hours": [2],
  "mdays": [-1],
  "minutes": [0],
  "months": [-1],
  "wdays": [-1]
}'

# Build full job JSON with Authorization header
JOB_JSON=$(cat <<EOF
{
  "job": {
    "url": "$URL",
    "enabled": true,
    "title": "$TITLE",
    "saveResponses": false,
    "schedule": $SCHEDULE_JSON,
    "extendedData": {
      "headers": {
        "Authorization": "Bearer $CRON_SECRET"
      }
    }
  }
}
EOF
)

echo "📝 Creating job: $TITLE"
echo "   Schedule: Daily at 2 AM UTC"
echo "   Authorization: Bearer ${CRON_SECRET:0:10}..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "$JOB_JSON" \
  "$API_ENDPOINT")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Success (HTTP $HTTP_CODE)"
  
  # Try to extract job ID from response
  if command -v jq &> /dev/null; then
    JOB_ID=$(echo "$BODY" | jq -r '.jobId // .job.jobId // empty' 2>/dev/null)
    if [ -n "$JOB_ID" ] && [ "$JOB_ID" != "null" ]; then
      echo "   Job ID: $JOB_ID"
    fi
  fi
  
  echo ""
  echo "🧪 Next steps:"
  echo "   1. Go to cron-job.org and verify the job is created"
  echo "   2. Test the job manually using 'Run now'"
  echo "   3. Verify it succeeds and refreshes tokens correctly"
  echo ""
  exit 0
else
  echo "❌ Failed (HTTP $HTTP_CODE)"
  if [ -n "$BODY" ]; then
    echo "   Response: $BODY"
  fi
  
  if [ "$HTTP_CODE" = "429" ]; then
    echo ""
    echo "⚠️  Rate limited - wait a few minutes and try again"
  fi
  
  echo ""
  exit 1
fi

