#!/bin/bash
# Sync secrets from Doppler to Vercel

DOPPLER_PROJECT="nextbestmove-prd"
DOPPLER_CONFIG="prd"
VERCEL_ENV="production"

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
    echo "$value" | vercel env add "$key" "$VERCEL_ENV" --force
  fi
done

echo "✅ Sync complete!"

