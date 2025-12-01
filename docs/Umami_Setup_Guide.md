# Umami Analytics Setup Guide

This guide explains how to set up Umami analytics for NextBestMove.

## Overview

Umami is a privacy-focused, open-source analytics platform that provides:
- Page view tracking
- Custom event tracking
- User identification
- GDPR-compliant analytics (no cookies, no personal data collection)

## Prerequisites

1. Umami instance running (self-hosted or Umami Cloud)
2. Website created in Umami dashboard
3. Website ID from Umami dashboard

## Setup Steps

### 1. Get Your Umami Credentials

1. Log into your Umami dashboard
2. Navigate to **Settings** → **Websites**
3. Find your website (or create a new one)
4. Copy the **Website ID** (UUID format)

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Umami Analytics
NEXT_PUBLIC_UMAMI_URL=https://your-umami-instance.com
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id-here
```

**Example:**
```bash
NEXT_PUBLIC_UMAMI_URL=https://analytics.nextbestmove.app
NEXT_PUBLIC_UMAMI_WEBSITE_ID=12345678-1234-1234-1234-123456789abc
```

### 3. Add to Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add both variables:
   - `NEXT_PUBLIC_UMAMI_URL`
   - `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
3. Ensure they're set for **Production**, **Preview**, and **Development** environments
4. Redeploy your application

### 4. Verify Installation

1. Deploy your changes
2. Visit your website
3. Check Umami dashboard - you should see page views appearing
4. Open browser DevTools Console - no errors should appear

## Usage

### Automatic Page View Tracking

Umami automatically tracks page views. No code changes needed.

### Custom Event Tracking

Track custom events using the `trackEvent` function:

```typescript
import { trackEvent } from "@/lib/analytics/umami";

// Track a button click
trackEvent("button_clicked", {
  button_name: "subscribe",
  plan_type: "standard",
});

// Track a plan generation
trackEvent("plan_generated", {
  user_id: "user-123",
  actions_count: 6,
  capacity: "medium",
});

// Track a subscription
trackEvent("subscription_created", {
  plan: "standard",
  interval: "month",
  amount: 2900,
});
```

### User Identification

Identify users for user-specific analytics:

```typescript
import { identifyUser } from "@/lib/analytics/umami";

// After user logs in
identifyUser(userId, {
  email: user.email,
  plan: subscription.plan,
  trial_ends_at: subscription.trialEndsAt,
});
```

## Common Events to Track

### Billing Events
- `subscription_created` - User starts a subscription
- `subscription_canceled` - User cancels subscription
- `checkout_started` - User clicks "Subscribe" button
- `checkout_completed` - User completes checkout
- `billing_portal_opened` - User opens billing portal

### Plan Events
- `plan_generated` - Daily plan is generated
- `plan_viewed` - User views daily plan page
- `action_completed` - User completes an action
- `action_snoozed` - User snoozes an action

### Onboarding Events
- `onboarding_started` - User starts onboarding
- `onboarding_completed` - User completes onboarding
- `calendar_connected` - User connects calendar

### Feature Usage
- `pin_created` - User creates a pin
- `pin_archived` - User archives a pin
- `weekly_summary_viewed` - User views weekly summary
- `content_idea_saved` - User saves a content idea

## Example: Tracking Paywall Events

```typescript
// In PaywallOverlay component
import { trackEvent } from "@/lib/analytics/umami";

useEffect(() => {
  trackEvent("paywall_viewed", {
    status: effectiveStatus,
    subscription_status: subscriptionStatus,
    is_read_only: isReadOnly,
  });
}, [effectiveStatus, subscriptionStatus, isReadOnly]);

const handleSubscribe = async () => {
  trackEvent("paywall_subscribe_clicked", {
    status: effectiveStatus,
  });
  // ... rest of subscribe logic
};
```

## Troubleshooting

### No Data Appearing in Umami

1. **Check Environment Variables:**
   - Verify `NEXT_PUBLIC_UMAMI_URL` is set correctly
   - Verify `NEXT_PUBLIC_UMAMI_WEBSITE_ID` matches your Umami dashboard
   - Ensure variables are prefixed with `NEXT_PUBLIC_` (required for client-side access)

2. **Check Browser Console:**
   - Open DevTools → Console
   - Look for Umami script loading errors
   - Check network tab for requests to Umami URL

3. **Verify Umami Instance:**
   - Ensure Umami instance is accessible
   - Check Umami dashboard shows the website is active
   - Verify website ID is correct

4. **Check Script Loading:**
   - View page source and verify Umami script tag is present
   - Script should load from `${NEXT_PUBLIC_UMAMI_URL}/script.js`

### Events Not Tracking

1. **Check if Umami is Loaded:**
   ```typescript
   if (typeof window !== "undefined" && window.umami) {
     console.log("Umami is loaded");
   } else {
     console.warn("Umami not loaded");
   }
   ```

2. **Verify Event Names:**
   - Event names should be lowercase with underscores (e.g., `button_clicked`)
   - Avoid special characters

3. **Check Event Data:**
   - Event data values must be strings, numbers, or booleans
   - Objects and arrays are not supported

## Privacy Considerations

Umami is privacy-focused by design:
- ✅ No cookies used
- ✅ No personal data collection
- ✅ GDPR compliant
- ✅ No cross-site tracking
- ✅ Data stored on your own server (if self-hosted)

## Next Steps

1. Set up environment variables in `.env.local` and Vercel
2. Deploy and verify page views are tracking
3. Add custom event tracking to key user actions
4. Create dashboards in Umami to visualize analytics

## Resources

- [Umami Documentation](https://umami.is/docs)
- [Umami Self-Hosting Guide](https://umami.is/docs/self-host)
- [Umami Cloud](https://umami.is/cloud)

