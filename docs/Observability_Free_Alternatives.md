# Free Observability Alternatives

This document outlines free alternatives to Sentry and PostHog for NextBestMove.

## Current Situation

- **Sentry**: Expensive, only 14-day free trial
- **PostHog**: Not rendering properly, reliability concerns

## Recommended Free Alternatives

### Option 1: Minimal Setup (Recommended for MVP)

**Error Tracking:** Console logging + Vercel logs

- ✅ Free (included with Vercel)
- ✅ No setup required
- ✅ Vercel dashboard shows logs
- ❌ No error aggregation/grouping
- ❌ Manual log checking

**Analytics:** Simple event logging to database

- ✅ Free
- ✅ Full control
- ✅ Privacy-friendly
- ❌ Need to build dashboards
- ❌ More development time

### Option 2: Free Tier Services

#### Error Tracking: GlitchTip (Recommended)

**Why GlitchTip:**

- ✅ Open source, Sentry-compatible SDK
- ✅ Free tier: 1,000 events/month
- ✅ Can self-host for unlimited events
- ✅ Easy migration from Sentry (same SDK)
- ✅ Simple setup

**Setup:**

1. Sign up at https://glitchtip.com (free tier available)
2. Or self-host: https://glitchtip.com/documentation/install
3. Get DSN and replace Sentry DSN

**Environment Variables:**

```bash
# GlitchTip DSN (same format as Sentry)
NEXT_PUBLIC_GLITCHTIP_DSN=https://your-project@glitchtip.com/your-project-id
# Or if self-hosting:
# NEXT_PUBLIC_GLITCHTIP_DSN=https://your-project@your-glitchtip-domain.com/your-project-id
```

**Note:** GlitchTip uses the same DSN format as Sentry, so you can use the `@sentry/nextjs` SDK with GlitchTip's DSN.

**Alternative: Rollbar**

- ✅ Free tier with unlimited users
- ✅ 5,000 events/month free
- ❌ Less features than GlitchTip

#### Analytics: Umami (Recommended)

**Why Umami:**

- ✅ 100% open source
- ✅ Privacy-focused (GDPR compliant)
- ✅ Self-hostable (completely free)
- ✅ Simple, lightweight
- ✅ Easy setup

**Setup:**

1. Self-host on Vercel (free): https://umami.is/docs/self-host
2. Or use Umami Cloud (free tier available)
3. Get tracking script and replace PostHog

**Environment Variables:**

For your Next.js app (client-side tracking):

```bash
# Umami tracking URL (where your Umami instance is hosted)
NEXT_PUBLIC_UMAMI_URL=https://your-umami-instance.com
# Or if using Umami Cloud:
# NEXT_PUBLIC_UMAMI_URL=https://cloud.umami.is

# Website ID (get this from Umami dashboard after creating a website)
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id-here
```

For self-hosting Umami (server-side):

```bash
# Required
DATABASE_URL=postgresql://user:password@host:5432/umami
APP_SECRET=your-random-secret-key-here

# Optional but recommended
HOSTNAME=0.0.0.0
PORT=3000
DISABLE_TELEMETRY=true
```

**Note:** You only need the `NEXT_PUBLIC_*` variables in your NextBestMove app. The server-side variables are only needed if you're self-hosting Umami itself.

**Alternative: Simple Database Logging**

- ✅ Completely free
- ✅ Full control
- ✅ No external dependencies
- ❌ Need to build dashboard

### Option 3: Self-Hosted (Most Control)

#### Error Tracking: GlitchTip (Self-Hosted)

- Deploy to Vercel, Railway, or Fly.io
- Unlimited events
- Full control

#### Analytics: Umami (Self-Hosted)

- Deploy to Vercel, Railway, or Fly.io
- Unlimited events
- Privacy-first

## Environment Variables Summary

### GlitchTip (Error Tracking)

**Required in Next.js app:**
- `NEXT_PUBLIC_GLITCHTIP_DSN` - Your GlitchTip DSN (format: `https://project@domain.com/project-id`)

**Example:**
```bash
NEXT_PUBLIC_GLITCHTIP_DSN=https://nextbestmove@glitchtip.com/123
```

**GitHub Secret name:** `GLITCHTIP_DSN` or `NEXT_PUBLIC_GLITCHTIP_DSN`

### Umami (Analytics)

**Required in Next.js app:**
- `NEXT_PUBLIC_UMAMI_URL` - Your Umami instance URL
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` - Website ID from Umami dashboard

**Example:**
```bash
NEXT_PUBLIC_UMAMI_URL=https://analytics.nextbestmove.app
NEXT_PUBLIC_UMAMI_WEBSITE_ID=12345678-1234-1234-1234-123456789abc
```

**GitHub Secret names:** 
- `UMAMI_URL` or `NEXT_PUBLIC_UMAMI_URL`
- `UMAMI_WEBSITE_ID` or `NEXT_PUBLIC_UMAMI_WEBSITE_ID`

**If self-hosting Umami (separate deployment):**
- `DATABASE_URL` - PostgreSQL connection string
- `APP_SECRET` - Random secret key (generate with: `openssl rand -base64 32`)

### Adding to GitHub Secrets

For the sync workflow to work, add these to GitHub Secrets:
- `GLITCHTIP_DSN` (or `NEXT_PUBLIC_GLITCHTIP_DSN`)
- `UMAMI_URL` (or `NEXT_PUBLIC_UMAMI_URL`)
- `UMAMI_WEBSITE_ID` (or `NEXT_PUBLIC_UMAMI_WEBSITE_ID`)

## Migration Plan

### Phase 1: Replace Sentry with GlitchTip

1. Sign up for GlitchTip (free tier)
2. Get DSN
3. Replace Sentry SDK with GlitchTip SDK
4. Update logger utility
5. Test error tracking

### Phase 2: Replace PostHog with Umami

1. Set up Umami (self-hosted or cloud)
2. Get tracking script
3. Replace PostHog initialization
4. Update event tracking calls
5. Test analytics

### Phase 3: Clean Up

1. Remove Sentry dependencies
2. Remove PostHog dependencies
3. Update documentation
4. Update environment variables

## Quick Start: Minimal Setup (No External Services)

If you want to start with the simplest approach:

### Error Tracking: Console + Vercel Logs

Keep the logger utility but remove Sentry integration:

```typescript
// Simple logger without Sentry
export function logError(message: string, error?: Error, context?: LogContext) {
  console.error(`[ERROR] ${message}`, error, context);
  // Logs automatically appear in Vercel dashboard
}
```

### Analytics: Database Event Logging

Create a simple `analytics_events` table and log events:

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_name TEXT NOT NULL,
  properties JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Then query for insights:

- Page views: `SELECT event_name, COUNT(*) FROM analytics_events GROUP BY event_name`
- User actions: `SELECT * FROM analytics_events WHERE user_id = ?`

## Recommendation

**For MVP/Startup:** Use **GlitchTip** (free tier) + **Umami** (self-hosted)

- Both are free
- Easy setup
- Professional features
- Can scale later

**For Simplest Setup:** Use **Console logging** + **Database event logging**

- Zero external dependencies
- Full control
- Free forever
- More development time needed

---

_Last updated: November 29, 2025_
