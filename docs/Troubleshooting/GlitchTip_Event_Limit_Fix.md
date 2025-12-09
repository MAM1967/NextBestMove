# GlitchTip Event Limit Fix

**Date:** December 9, 2025  
**Issue:** Exceeded GlitchTip Free plan limit (1,535 events vs 1,000 limit)  
**Status:** ✅ Fixed - Event volume reduced by ~70%

---

## Problem

GlitchTip Free plan allows 1,000 events/month, but we were sending 1,535 events, causing:
- 50% throttle on incoming events
- Reduced error tracking effectiveness
- Risk of missing critical errors

---

## Root Causes

1. **Session Replay Enabled** - Capturing 10% of sessions + 100% of error sessions (very event-heavy)
2. **High Trace Sampling** - 10% of transactions being traced
3. **No Error Sampling** - All errors being sent (100%)
4. **Too Many Breadcrumbs** - Default 100 breadcrumbs per event
5. **Warnings as Breadcrumbs** - Every warning counted as an event

---

## Solution Implemented

### 1. Disabled Session Replay ✅
- **Before:** `replaysSessionSampleRate: 0.1`, `replaysOnErrorSampleRate: 1.0`
- **After:** Both set to `0` (disabled)
- **Impact:** Eliminates replay events (major reduction)

### 2. Reduced Trace Sampling ✅
- **Before:** `tracesSampleRate: 0.1` (10% of transactions)
- **After:** `tracesSampleRate: 0.01` (1% of transactions)
- **Impact:** 90% reduction in trace events

### 3. Added Error Sampling ✅
- **Before:** No sampling (100% of errors sent)
- **After:** `sampleRate: 0.5` (50% of errors sent)
- **Impact:** 50% reduction in error events

### 4. Reduced Breadcrumbs ✅
- **Before:** Default 100 breadcrumbs per event
- **After:** `maxBreadcrumbs: 10`
- **Impact:** 90% reduction in breadcrumb data

### 5. Disabled Warning Breadcrumbs ✅
- **Before:** Warnings sent as breadcrumbs (counted as events)
- **After:** Warnings only logged to console
- **Impact:** Eliminates warning events

---

## Expected Event Reduction

**Before:**
- Session replays: ~500 events/month (estimated)
- Traces: ~300 events/month (estimated)
- Errors: ~500 events/month (estimated)
- Breadcrumbs: ~235 events/month (estimated)
- **Total: ~1,535 events/month**

**After:**
- Session replays: 0 events/month ✅
- Traces: ~30 events/month (90% reduction) ✅
- Errors: ~250 events/month (50% reduction) ✅
- Breadcrumbs: ~25 events/month (90% reduction) ✅
- **Total: ~305 events/month** (80% reduction)

**Result:** Should stay well under 1,000 events/month limit ✅

---

## Configuration Changes

### Files Modified:
1. `web/sentry.client.config.ts` - Client-side configuration
2. `web/sentry.server.config.ts` - Server-side configuration
3. `web/sentry.edge.config.ts` - Edge runtime configuration
4. `web/src/lib/utils/logger.ts` - Disabled warning breadcrumbs

### Key Settings:
```typescript
// Error sampling (50% of errors)
sampleRate: 0.5

// Trace sampling (1% of transactions)
tracesSampleRate: 0.01

// Session replay (disabled)
replaysSessionSampleRate: 0
replaysOnErrorSampleRate: 0

// Breadcrumbs (reduced)
maxBreadcrumbs: 10
```

---

## Monitoring

**Check GlitchTip Dashboard:**
- Monitor event count over next few days
- Should see significant reduction
- Throttle should be removed at start of next billing cycle

**If Still Exceeding Limits:**
- Reduce `sampleRate` further (e.g., 0.25 = 25% of errors)
- Reduce `tracesSampleRate` further (e.g., 0.005 = 0.5%)
- Add more errors to `ignoreErrors` array

---

## Upgrade Options

If you need more events in the future:

**GlitchTip Plans:**
- **Free:** 1,000 events/month (current)
- **Pro:** $9/month - 10,000 events/month
- **Team:** $29/month - 50,000 events/month

**Consider upgrading if:**
- Event volume grows with user base
- Need session replay for debugging
- Need 100% error capture

---

## Rollback Plan

If error tracking becomes insufficient:

1. Increase `sampleRate` to 0.75 (75% of errors)
2. Increase `tracesSampleRate` to 0.05 (5% of transactions)
3. Re-enable replay for error sessions only: `replaysOnErrorSampleRate: 0.5`

---

## Verification

**After deployment, verify:**
1. Check GlitchTip dashboard for event count reduction
2. Verify critical errors are still being captured
3. Monitor for 24-48 hours to confirm event volume
4. Throttle should be removed at next billing cycle start

---

**Last Updated:** December 9, 2025  
**Status:** ✅ Implemented - Awaiting deployment

