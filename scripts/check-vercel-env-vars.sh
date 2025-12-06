#!/bin/bash

# Script to check what environment variables Vercel CLI sees
# This helps diagnose Preview vs Production variable issues

echo "🔍 Checking Vercel environment variables..."
echo ""

cd "$(dirname "$0")/../web" || exit 1

# Pull environment variables for Preview
echo "📋 Preview Environment Variables:"
vercel env pull .env.vercel.preview --environment=preview 2>/dev/null || echo "Failed to pull Preview vars"

if [ -f .env.vercel.preview ]; then
  echo ""
  echo "NEXT_PUBLIC_SUPABASE_URL:"
  grep "NEXT_PUBLIC_SUPABASE_URL" .env.vercel.preview || echo "  Not found"
  echo ""
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY (first 50 chars):"
  grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.vercel.preview | cut -c1-80 || echo "  Not found"
  echo ""
  rm .env.vercel.preview
fi

echo ""
echo "📋 Production Environment Variables:"
vercel env pull .env.vercel.production --environment=production 2>/dev/null || echo "Failed to pull Production vars"

if [ -f .env.vercel.production ]; then
  echo ""
  echo "NEXT_PUBLIC_SUPABASE_URL:"
  grep "NEXT_PUBLIC_SUPABASE_URL" .env.vercel.production || echo "  Not found"
  echo ""
  rm .env.vercel.production
fi

echo ""
echo "✅ Check complete. Compare the URLs above."
echo "   Preview should show: adgiptzbxnzddbgfeuut"
echo "   Production should show: lilhqhbbougkblznspow"

