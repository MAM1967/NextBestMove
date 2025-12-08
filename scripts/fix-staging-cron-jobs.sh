#!/bin/bash

# Script to fix failing staging cron jobs by updating them to use Authorization headers
# instead of query parameters
# Usage: ./scripts/fix-staging-cron-jobs.sh [CRON_SECRET]

set -e

if [ -z "$1" ]; then
  echo "❌ Error: CRON_SECRET required"
  echo "Usage: ./scripts/fix-staging-cron-jobs.sh YOUR_CRON_SECRET"
  exit 1
fi

CRON_SECRET="$1"
API_KEY="tA4auCiGFs4DIVKM01ho5xJhKHyzR2XLgB8SEzaitOk="
STAGING_URL="https://staging.nextbestmove.app"
API_ENDPOINT="https://api.cron-job.org/jobs"

echo "🔧 Fixing staging cron jobs to use Authorization headers..."
echo "   Staging URL: $STAGING_URL"
echo "   API Key: ${API_KEY:0:10}..."
echo "   CRON_SECRET: ${CRON_SECRET:0:10}..."
echo ""

# Function to fetch all jobs and find job IDs by title
fetch_job_id() {
  local title="$1"
  
  echo "🔍 Searching for job: $title" >&2
  
  local response=$(curl -s -X GET \
    -H "Authorization: Bearer $API_KEY" \
    "$API_ENDPOINT")
  
  # Parse JSON to find job with matching title
  # API response structure: {"jobs": [{"jobId": 123, "title": "...", ...}]}
  if command -v jq &> /dev/null; then
    local job_id=$(echo "$response" | jq -r ".jobs[] | select(.title == \"$title\") | .jobId" 2>/dev/null | head -1)
  else
    # Fallback: use Python to parse JSON
    local job_id=$(echo "$response" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    for job in data.get('jobs', []):
        if job.get('title') == '$title':
            print(job.get('jobId', ''))
            sys.exit(0)
except Exception as e:
    sys.stderr.write(str(e))
    pass
" 2>/dev/null)
  fi
  
  if [ -z "$job_id" ] || [ "$job_id" = "null" ]; then
    echo "  ⚠️  Job not found: $title" >&2
    return 1
  fi
  
  echo "  ✅ Found job ID: $job_id" >&2
  echo "$job_id"
  return 0
}

# Function to update a cron job to use Authorization header
update_job() {
  local job_id="$1"
  local title="$2"
  local endpoint="$3"
  
  echo ""
  echo "📝 Updating: $title (ID: $job_id)"
  
  # Build URL without query parameter
  local url="${STAGING_URL}${endpoint}"
  
  # Build update JSON with Authorization header
  local update_json="{
    \"job\": {
      \"url\": \"$url\",
      \"extendedData\": {
        \"headers\": {
          \"Authorization\": \"Bearer $CRON_SECRET\"
        }
      }
    }
  }"
  
  echo "  URL: $url"
  echo "  Authorization: Bearer ${CRON_SECRET:0:10}..."
  
  local response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PATCH \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "$update_json" \
    "$API_ENDPOINT/$job_id")
  
  local http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
  local body=$(echo "$response" | grep -v "HTTP_CODE:")
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
    echo "  ✅ Success (HTTP $http_code)"
    return 0
  else
    echo "  ❌ Failed (HTTP $http_code)"
    if [ -n "$body" ]; then
      echo "  Response: $body"
    fi
    return 1
  fi
}

SUCCESS_COUNT=0
FAIL_COUNT=0

# Jobs to fix (title, endpoint)
declare -a jobs=(
  "[STAGING] Daily Plans|/api/cron/daily-plans"
  "[STAGING] Payment Failure Recovery|/api/cron/payment-failure-recovery"
  "[STAGING] Streak Recovery|/api/cron/streak-recovery"
  "[STAGING] Win-Back Campaign|/api/cron/win-back-campaign"
  "[STAGING] Morning Plan Email|/api/notifications/morning-plan"
)

echo "📋 Jobs to update: ${#jobs[@]}"
echo ""

# Process each job
for job_info in "${jobs[@]}"; do
  IFS='|' read -r title endpoint <<< "$job_info"
  
  # Fetch job ID
  job_id=$(fetch_job_id "$title")
  
  if [ $? -eq 0 ] && [ -n "$job_id" ]; then
    # Update the job
    update_job "$job_id" "$title" "$endpoint"
    
    if [ $? -eq 0 ]; then
      SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    # Add delay to avoid rate limiting
    sleep 2
  else
    echo "  ❌ Skipping: Could not find job ID"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

echo ""
echo "📊 Summary:"
echo "   ✅ Success: $SUCCESS_COUNT"
echo "   ❌ Failed: $FAIL_COUNT"
echo "   📋 Total: ${#jobs[@]}"

if [ $FAIL_COUNT -eq 0 ]; then
  echo ""
  echo "✅ All cron jobs updated successfully!"
  echo ""
  echo "🧪 Next steps:"
  echo "   1. Go to cron-job.org and verify the jobs are updated"
  echo "   2. Test each job manually using 'Run now'"
  echo "   3. Verify they succeed without 'Invalid API key' errors"
  exit 0
else
  echo ""
  echo "⚠️  Some cron jobs failed to update. Check the errors above."
  exit 1
fi

