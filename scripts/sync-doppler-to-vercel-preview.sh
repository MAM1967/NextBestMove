#!/bin/bash
# Sync secrets from Doppler to Vercel Preview builds
# Usage: ./scripts/sync-doppler-to-vercel-preview.sh

set -e

DOPPLER_PROJECT="nextbestmove-prd"
DOPPLER_CONFIG="prd"
VERCEL_ENV="preview"

echo "📥 Fetching secrets from Doppler for Preview builds..."
echo "   Project: $DOPPLER_PROJECT"
echo "   Config: $DOPPLER_CONFIG"
echo "   Vercel Environment: $VERCEL_ENV"
echo ""

# Check if Doppler CLI is installed
if ! command -v doppler &> /dev/null; then
    echo "❌ Doppler CLI is not installed. Install it from: https://docs.doppler.com/docs/install-cli"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Install it with: npm install -g vercel"
    exit 1
fi

echo "📥 Fetching secrets from Doppler..."
doppler secrets download \
  --project "$DOPPLER_PROJECT" \
  --config "$DOPPLER_CONFIG" \
  --format env \
  --no-file | \
while IFS='=' read -r key value; do
  # Skip empty lines and comments
  if [[ -z "$key" ]] || [[ "$key" =~ ^# ]]; then
    continue
  fi

  # Skip Doppler's own metadata variables (not needed in Vercel)
  if [[ "$key" == "DOPPLER_PROJECT" ]] || \
     [[ "$key" == "DOPPLER_CONFIG" ]] || \
     [[ "$key" == "DOPPLER_ENVIRONMENT" ]]; then
    echo "⏭️  Skipping Doppler metadata variable: $key"
    continue
  fi

  # Remove quotes from value if present
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//')

  if [ -n "$key" ] && [ -n "$value" ]; then
    echo "📤 Syncing $key to Vercel ($VERCEL_ENV)..."
    echo "$value" | vercel env add "$key" "$VERCEL_ENV" --force 2>/dev/null || {
      echo "    ⚠️  $key may have failed to sync (may already exist)"
    }
  fi
done

echo ""
echo "✅ Doppler sync to Preview complete!"
echo "   Preview builds will now use the latest environment variables from Doppler"

