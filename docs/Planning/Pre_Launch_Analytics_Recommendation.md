# Pre-Launch Analytics Recommendation

**Date:** December 24, 2025  
**Question:** Should we add PostHog (or similar product analytics) before launch?

---

## Current State

### What You Have ✅
- **Umami** - Privacy-focused page view analytics (basic)
- **GlitchTip** - Error tracking (Sentry-compatible)
- **Console.log tracking** - Paywall analytics (not real analytics)

### What You're Missing ❌
- **Product analytics** - Custom event tracking
- **Conversion funnels** - Track user journeys
- **User behavior** - Understand how users actually use the app
- **Success metrics tracking** - 48-hour activation, weekly habit, revenue signals

---

## Recommendation: **YES, Add PostHog Before Launch**

### Why It's Critical

1. **You Need to Measure Success Metrics**
   - PRD defines specific success metrics (48-hour activation, weekly habit, revenue signal)
   - Umami only tracks page views, not custom events
   - You can't measure "Fast Win completion" or "action completions" with Umami

2. **Launch Day 1 Data is Irreplaceable**
   - First users are your most valuable data
   - Can't retroactively track events that weren't captured
   - Early behavior patterns inform product decisions

3. **Post-Launch is Too Late**
   - By the time you add analytics, you've lost weeks/months of data
   - Early adopters' behavior is critical for product-market fit
   - You need data to iterate quickly

4. **Low Time Investment, High Value**
   - Setup: 1-2 hours
   - Free tier: 1M events/month (plenty for launch)
   - One-time setup, ongoing value

---

## PostHog vs Alternatives

### PostHog (Recommended) ✅

**Pros:**
- ✅ Free tier: 1M events/month (generous)
- ✅ All-in-one: Analytics + Session Replay + Feature Flags + A/B Testing
- ✅ Privacy-friendly (self-hostable option)
- ✅ Great Next.js integration
- ✅ Easy to set up (1-2 hours)
- ✅ Product analytics (not just page views)

**Cons:**
- ⚠️ Another tool to manage
- ⚠️ Free tier has limits (but 1M/month is plenty for launch)

**Cost:** $0/month (free tier) → $450/month (if you exceed 1M events)

### Mixpanel (Alternative)

**Pros:**
- ✅ Excellent product analytics
- ✅ Great funnel analysis
- ✅ Free tier: 20M events/month

**Cons:**
- ❌ More expensive as you scale
- ❌ Less all-in-one than PostHog
- ❌ More complex setup

**Cost:** $0/month (free tier) → $25/month (paid plans)

### Umami (Current - Keep It)

**Pros:**
- ✅ Privacy-focused
- ✅ Simple page view tracking
- ✅ Already implemented

**Cons:**
- ❌ No custom event tracking
- ❌ No conversion funnels
- ❌ No user behavior analysis
- ❌ Can't track success metrics

**Recommendation:** Keep Umami for basic page views, add PostHog for product analytics

---

## What to Track (Based on PRD Success Metrics)

### 48-Hour Activation
- `pin_created` - When user creates first lead
- `fast_win_completed` - When user completes Fast Win
- `action_completed` - When user marks action as done
- `got_reply` - When user marks action as "got reply"

### Weekly Habit
- `daily_plan_viewed` - Track daily engagement
- `action_completed` - Track completion rate
- `days_active` - Calculate from events

### Revenue Signal
- `booked_call_logged` - When user logs a booked call (if implemented)
- `subscription_started` - Trial → Paid conversion

### Content Behavior
- `content_prompt_saved` - When user saves content prompt
- `content_prompt_copied` - When user copies to clipboard

### Product Health
- `onboarding_completed` - Track completion rate
- `daily_plan_generated` - Track plan generation success
- `paywall_viewed` - Track paywall impressions
- `paywall_cta_clicked` - Track conversion attempts

---

## Implementation Plan

### Phase 1: Basic Setup (1-2 hours)

1. **Sign up for PostHog**
   - Go to https://posthog.com
   - Create free account
   - Get API key

2. **Install PostHog**
   ```bash
   npm install posthog-js
   ```

3. **Add to Next.js**
   - Create `lib/analytics/posthog.ts`
   - Initialize in `app/layout.tsx`
   - Add environment variables

4. **Track Critical Events**
   - Onboarding completion
   - Fast Win completion
   - Action completion
   - Paywall interactions

### Phase 2: Success Metrics (1 hour)

5. **Implement Success Metric Tracking**
   - 48-hour activation events
   - Weekly habit tracking
   - Revenue signal tracking

### Phase 3: Advanced (Post-Launch)

6. **Add Session Replay** (optional)
7. **Set up Feature Flags** (optional)
8. **Create Dashboards** (optional)

---

## Cost Analysis

### PostHog Free Tier
- **1M events/month** - Free forever
- **Unlimited users** - Free
- **Session replay** - 15 hours/month free
- **Feature flags** - Unlimited free

**For Launch:** $0/month (free tier covers launch easily)

**When to Upgrade:**
- If you exceed 1M events/month (unlikely in first 6 months)
- If you need more session replay hours
- If you need advanced features

**Estimated Timeline to Paid:**
- 1M events = ~33k events/day
- At 100 active users/day = ~330 events/user/day
- You'd need ~300 active users/day to hit the limit
- **Likely 6+ months before needing to pay**

---

## Alternative: Wait Until Post-Launch?

### Why NOT to Wait

1. **Lost Data**
   - Can't retroactively track events
   - First users are most valuable for learning
   - Early behavior patterns are critical

2. **Delayed Insights**
   - Takes 1-2 weeks to get meaningful data
   - By then, you've lost early user insights
   - Slower iteration cycle

3. **Technical Debt**
   - Adding analytics later requires code changes
   - Risk of breaking existing flows
   - More complex to retrofit

4. **Success Metrics**
   - PRD defines specific metrics to track
   - Can't measure without proper analytics
   - Need data to validate product-market fit

### When It's OK to Wait

- If you're doing a soft launch to < 10 users
- If you have manual tracking in place
- If launch is > 1 month away

**For NextBestMove:** You're close to launch, so add it now.

---

## Recommendation Summary

### ✅ **Add PostHog Before Launch**

**Rationale:**
1. You need to track success metrics (PRD requirements)
2. Umami can't do custom event tracking
3. Launch Day 1 data is irreplaceable
4. Low time investment (1-2 hours)
5. Free tier is generous (1M events/month)
6. Better to have it from day 1

**Timeline:**
- **Setup:** 1-2 hours
- **Critical events:** 1 hour
- **Total:** 2-3 hours

**Priority:** High - Should be in "Launch Hardening" checklist

---

## Implementation Checklist

- [ ] Sign up for PostHog account
- [ ] Install `posthog-js` package
- [ ] Create `lib/analytics/posthog.ts` utility
- [ ] Initialize PostHog in `app/layout.tsx`
- [ ] Add environment variables (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`)
- [ ] Track onboarding completion
- [ ] Track Fast Win completion
- [ ] Track action completion
- [ ] Track paywall interactions
- [ ] Track subscription events
- [ ] Test in staging
- [ ] Verify events in PostHog dashboard
- [ ] Document in `docs/Observability.md`

---

## Next Steps

1. **Decision:** Add PostHog to "Launch Hardening" checklist
2. **Timing:** Implement 1-2 weeks before launch
3. **Scope:** Basic setup + critical events (Phase 1 + Phase 2)
4. **Advanced features:** Add post-launch (Phase 3)

---

**Bottom Line:** Yes, add PostHog before launch. It's a 2-3 hour investment that provides irreplaceable value from day 1.

