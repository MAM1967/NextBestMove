# Observability

This document provides an overview of the observability tools used in NextBestMove.

## Current Setup

NextBestMove uses three observability tools:

1. **GlitchTip** - Error tracking and monitoring
2. **Umami** - Privacy-focused page view analytics
3. **PostHog** - Product analytics and event tracking

GlitchTip and Umami are free, open-source, and privacy-compliant. PostHog offers a generous free tier (1M events/month).

## Documentation

- **[GlitchTip Setup Guide](./GlitchTip_Setup_Guide.md)** - Complete guide for setting up error tracking
- **[Umami Setup Guide](./Umami_Setup_Guide.md)** - Complete guide for setting up analytics
- **[Finding Umami Website ID](./Umami_Finding_Website_ID.md)** - Quick reference for finding your Umami Website ID

## Quick Reference

### Environment Variables

**GlitchTip (Error Tracking):**
```bash
NEXT_PUBLIC_GLITCHTIP_DSN=https://your-project@glitchtip.com/project-id
```

**Umami (Page View Analytics):**
```bash
NEXT_PUBLIC_UMAMI_URL=https://your-umami-instance.com
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id-here
```

**PostHog (Product Analytics):**
```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_posthog_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # Optional, defaults to this
```

### Implementation

- **Error Tracking**: Uses `@sentry/nextjs` SDK (Sentry-compatible) with GlitchTip DSN
- **Page View Analytics**: Uses Umami tracking script embedded in `layout.tsx`
- **Product Analytics**: Uses PostHog JS SDK for custom event tracking
- **Logging**: Centralized logger utility in `web/src/lib/utils/logger.ts`

## Status

✅ **GlitchTip**: Configured and active  
✅ **Umami**: Configured and active  
✅ **PostHog**: Configured and active  
✅ **Logger**: Integrated with GlitchTip for automatic error reporting

## Event Tracking

PostHog tracks the following critical events:

- **Onboarding**: `onboarding_completed` - When user completes onboarding
- **Actions**: `action_completed`, `fast_win_completed`, `got_reply` - Action interactions
- **Leads**: `lead_created` - When a new lead/relationship is added
- **Plans**: `daily_plan_generated` - When a daily plan is generated
- **Paywall**: `paywall_viewed`, `paywall_cta_clicked` - Paywall interactions
- **Subscriptions**: `subscription_started`, `subscription_upgraded` - Billing events

See `web/src/lib/analytics/posthog.ts` for the complete list of tracked events.

---

_For historical context, see [Archive/Observability/](./Archive/Observability/)_

