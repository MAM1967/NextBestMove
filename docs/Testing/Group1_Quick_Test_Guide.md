# Group 1 Quick Test Guide

**5-Minute Quick Test** for Group 1 features

---

## Prerequisites

1. Have a test user account ready
2. Access to Supabase database (or local)
3. Browser console open (for analytics)
4. Email access (for reminder testing)

---

## Quick Test Steps

### 1. Test Grace Period Banner (2 minutes)

**Setup:**
```sql
-- Set user to Day 17 (3 days into grace period)
UPDATE billing_subscriptions 
SET trial_ends_at = NOW() - INTERVAL '3 days',
    status = 'canceled'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers 
  WHERE user_id = '<your_test_user_id>'
);
```

**Test:**
1. Log in as test user
2. Go to `/app` (dashboard)
3. ✅ **Expected:** Amber banner at top saying "Your trial has ended - You have 4 days left to subscribe"
4. Click "Subscribe Now" → Should go to settings
5. Try to generate plan at `/app/plan`
6. ✅ **Expected:** Error message "Your trial has ended. Subscribe to continue generating daily plans."

---

### 2. Test Trial Reminder (1 minute)

**Setup:**
```sql
-- Set user to Day 12 (2 days remaining)
UPDATE billing_subscriptions 
SET trial_ends_at = NOW() + INTERVAL '2 days',
    status = 'trialing'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers 
  WHERE user_id = '<your_test_user_id>'
);
```

**Test:**
```bash
# Call cron endpoint (replace with your CRON_SECRET)
curl -X GET "http://localhost:3000/api/cron/trial-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Check:**
1. ✅ **Expected:** Response shows `remindersSent: 1`
2. Check email inbox
3. ✅ **Expected:** Email with subject "2 days left in your trial — Keep your rhythm going"

---

### 3. Test Paywall Variants (2 minutes)

**Test A: Past Due User**
```sql
UPDATE billing_subscriptions 
SET status = 'past_due'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers 
  WHERE user_id = '<your_test_user_id>'
);
```

1. Go to `/app/plan` (without existing plan)
2. ✅ **Expected:** PaywallOverlay with amber styling, "Payment failed — Update to keep your streak alive"
3. Check browser console
4. ✅ **Expected:** `[Paywall Analytics] Paywall viewed` log

**Test B: Canceled User**
```sql
UPDATE billing_subscriptions 
SET status = 'canceled',
    trial_ends_at = NOW() - INTERVAL '10 days'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers 
  WHERE user_id = '<your_test_user_id>'
);
```

1. Go to `/app/plan` (without existing plan)
2. ✅ **Expected:** PaywallOverlay with "Your plan is paused" message
3. Click "Reactivate Subscription"
4. ✅ **Expected:** Console log `[Paywall Analytics] Subscribe CTA clicked`

---

## Verification Checklist

- [ ] Grace period banner appears (Day 15-21)
- [ ] Banner shows correct days remaining
- [ ] Plan generation blocked during grace period
- [ ] Day 12 reminder email sent
- [ ] Day 14 reminder email sent
- [ ] Paywall shows correct variant for past-due
- [ ] Paywall shows correct variant for canceled
- [ ] Analytics logs appear in console
- [ ] No errors in console
- [ ] No errors in server logs

---

## Common Issues

**Banner not showing?**
- Check subscription status is "canceled"
- Check `trial_ends_at` is within last 7 days
- Check browser console for errors

**Email not sending?**
- Check `RESEND_API_KEY` is set
- Check user has valid email in database
- Check Resend dashboard for delivery status

**Cron job failing?**
- Check `CRON_SECRET` matches
- Check authorization header format: `Bearer <secret>`
- Check server logs for errors

---

## Reset Test User

To reset a test user back to normal:
```sql
-- Reset to active subscription
UPDATE billing_subscriptions 
SET status = 'active',
    trial_ends_at = NULL,
    current_period_end = NOW() + INTERVAL '30 days'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers 
  WHERE user_id = '<your_test_user_id>'
);
```

---

_For full test plan, see `Group1_Trial_Conversion_Test_Plan.md`_

