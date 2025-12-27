# Email Templates Testing Guide

**Last Updated:** December 27, 2025  
**Environment:** Staging (`staging.nextbestmove.app`)

This guide provides step-by-step instructions for testing all email templates with the new branding.

---

## Prerequisites

1. ✅ Staging environment is deployed with latest changes
2. ✅ You have access to a test email address
3. ✅ You have a test user account in staging (or can create one)
4. ✅ You have the `CRON_SECRET` or `TEST_ENDPOINT_SECRET` for protected endpoints

---

## Quick Test - All Emails

### Option 1: Using Browser/Postman

Replace `YOUR_EMAIL@example.com` with your test email and `YOUR_SECRET` with your CRON_SECRET.

### Option 2: Using cURL

All examples below use cURL. Replace placeholders:
- `YOUR_EMAIL@example.com` → Your test email
- `YOUR_SECRET` → Your CRON_SECRET or TEST_ENDPOINT_SECRET
- `staging.nextbestmove.app` → Your staging URL

---

## Email Templates to Test

### 1. Password Reset Email

**Endpoint:** `POST /api/test-email?to=YOUR_EMAIL@example.com`

**Test:**
```bash
curl -X POST "https://staging.nextbestmove.app/api/test-email?to=YOUR_EMAIL@example.com"
```

**What to Check:**
- ✅ Logo header (black square + NEXTBESTMOVE text)
- ✅ Primary blue button (#2563EB)
- ✅ Proper spacing and typography
- ✅ Reset link works

---

### 2. Payment Failure Emails

#### Day 0 (Instant Downgrade)
**Endpoint:** `POST /api/test/send-payment-failure-email?userEmail=YOUR_EMAIL@example.com&daysSinceFailure=0`

**Test:**
```bash
curl -X POST \
  "https://staging.nextbestmove.app/api/test/send-payment-failure-email?userEmail=YOUR_EMAIL@example.com&daysSinceFailure=0" \
  -H "Authorization: Bearer YOUR_SECRET"
```

**What to Check:**
- ✅ Subject: "Your payment failed — Account moved to Free tier"
- ✅ Message clearly states instant downgrade to Free tier
- ✅ Button: "Update Payment Method"
- ✅ Footer reassures data is safe

#### Day 3 (Reminder)
**Test:**
```bash
curl -X POST \
  "https://staging.nextbestmove.app/api/test/send-payment-failure-email?userEmail=YOUR_EMAIL@example.com&daysSinceFailure=3" \
  -H "Authorization: Bearer YOUR_SECRET"
```

**What to Check:**
- ✅ Subject: "Reminder: Update your payment method to restore access"
- ✅ Mentions Free tier status
- ✅ Clear call to action

#### Day 7 (Final Reminder)
**Test:**
```bash
curl -X POST \
  "https://staging.nextbestmove.app/api/test/send-payment-failure-email?userEmail=YOUR_EMAIL@example.com&daysSinceFailure=7" \
  -H "Authorization: Bearer YOUR_SECRET"
```

**What to Check:**
- ✅ Subject: "We noticed you haven't been active"
- ✅ No mention of "read-only mode" or "archiving"
- ✅ Encourages login and account safety message

---

### 3. Trial Reminder Emails

**Note:** These are sent by cron jobs. To test manually, you can:

1. **Create a test user with trial ending in 2 days (Day 12)**
2. **Or trigger the cron job manually** (if you have access)

**Day 12 Email:**
- Subject: "2 days left in your Standard trial — Keep your rhythm going"
- ✅ Should clarify: "If you don't upgrade, you'll automatically continue on the Free tier"
- ✅ No "No commitment required" language

**Day 14 Email:**
- Subject: "Last day of your Standard trial — Upgrade to unlock automatic plans"
- ✅ Clear explanation of Free tier downgrade
- ✅ Upgrade CTA

**Manual Test (if needed):**
```sql
-- In Supabase SQL Editor, set a user's trial to end in 2 days
UPDATE users 
SET trial_ends_at = NOW() + INTERVAL '2 days'
WHERE email = 'YOUR_EMAIL@example.com';
```

Then wait for cron or trigger manually.

---

### 4. Streak Recovery Email

**Endpoint:** `GET /api/test-streak-email?email=YOUR_EMAIL@example.com`

**Test:**
```bash
curl "https://staging.nextbestmove.app/api/test-streak-email?email=YOUR_EMAIL@example.com"
```

**What to Check:**
- ✅ Subject: "Let's get your streak back on track"
- ✅ Encouraging tone
- ✅ "View Your Comeback Plan" button
- ✅ Brand styling

---

### 5. Win-Back Campaign Emails

**Endpoint:** `POST /api/test/send-win-back-email?userEmail=YOUR_EMAIL@example.com&daysSinceCancellation=7`

**Test Day 7:**
```bash
curl -X POST \
  "https://staging.nextbestmove.app/api/test/send-win-back-email?userEmail=YOUR_EMAIL@example.com&daysSinceCancellation=7" \
  -H "Authorization: Bearer YOUR_SECRET"
```

**Test Day 30:**
```bash
curl -X POST \
  "https://staging.nextbestmove.app/api/test/send-win-back-email?userEmail=YOUR_EMAIL@example.com&daysSinceCancellation=30" \
  -H "Authorization: Bearer YOUR_SECRET"
```

**Test Day 90:**
```bash
curl -X POST \
  "https://staging.nextbestmove.app/api/test/send-win-back-email?userEmail=YOUR_EMAIL@example.com&daysSinceCancellation=90" \
  -H "Authorization: Bearer YOUR_SECRET"
```

**Test Day 180:**
```bash
curl -X POST \
  "https://staging.nextbestmove.app/api/test/send-win-back-email?userEmail=YOUR_EMAIL@example.com&daysSinceCancellation=180" \
  -H "Authorization: Bearer YOUR_SECRET"
```

**What to Check:**
- ✅ Different messages for each day
- ✅ Appropriate CTAs
- ✅ Brand styling

---

### 6. Weekly Summary Email

**Endpoint:** `GET /api/test/send-weekly-review-email?email=YOUR_EMAIL@example.com`

**Prerequisites:** User must have a weekly summary generated for the previous week.

**Test:**
```bash
curl "https://staging.nextbestmove.app/api/test/send-weekly-review-email?email=YOUR_EMAIL@example.com"
```

**What to Check:**
- ✅ Metrics grid (Days Active, Actions Completed, Replies, Calls Booked)
- ✅ Insight section (if available)
- ✅ Next Week Focus (if available)
- ✅ Content Prompts (if available)
- ✅ Brand styling throughout

---

### 7. Billing Pause Acknowledgment (Day 7 Inactivity)

**Note:** This is sent by cron job. To test:

1. **Set a user to have 7 days of inactivity**
2. **Or trigger the cron job manually**

**What to Check:**
- ✅ Subject: "We noticed you haven't been active"
- ✅ No mention of "pause" feature (feature removed)
- ✅ Reassures account is safe
- ✅ Encourages login

---

## Notification Emails (Sent by Cron Jobs)

These are sent automatically by cron jobs. To test them, you may need to:

1. **Set up test data** (actions, fast wins, etc.)
2. **Trigger the cron jobs manually** (if you have access)
3. **Wait for scheduled sends**

### Morning Plan Email
- Sent daily at 8am in user's timezone
- Includes Fast Win and Today's Actions

### Fast Win Reminder
- Sent at 2pm if fast win not completed

### Follow-Up Alerts
- Sent when replies are overdue

---

## Branding Checklist

For **every email**, verify:

- ✅ **Logo Header:** Black square (24x24px) + "NEXTBESTMOVE" text
- ✅ **Primary Button:** Blue (#2563EB), not dark gray
- ✅ **Typography:** 
  - Heading: 24px, gray-800 (#111827)
  - Body: 16px, gray-700 (#1F2937)
  - Footer: 14px, gray-500 (#6B7280)
- ✅ **Spacing:** Consistent padding (16px, 24px, 32px)
- ✅ **Border Radius:** 8px for buttons, 12px for cards
- ✅ **Background:** Light gray (#F9FAFB) with white card
- ✅ **Responsive:** Works on mobile and desktop

---

## Testing Tips

1. **Use a Real Email Client:** Test in Gmail, Outlook, Apple Mail, etc.
2. **Check Mobile:** View emails on mobile devices
3. **Test Links:** Click all buttons and links to ensure they work
4. **Check Spam:** Verify emails aren't going to spam
5. **Test Different Browsers:** View emails in different email clients
6. **Verify Staging Prefix:** All staging emails should have `[STAGING]` in subject
7. **Rate Limiting:** Resend has a rate limit of 2 requests per second. The test script automatically adds delays between requests. If testing manually, wait at least 0.6 seconds between requests.

---

## Troubleshooting

### Email Not Received
- Check spam folder
- Verify email address is correct
- Check Resend dashboard for delivery status
- Check server logs for errors

### Styling Issues
- Some email clients strip CSS - verify in multiple clients
- Use email client preview tools
- Check for inline styles (they should be inline)

### Test Endpoint Errors
- Verify `CRON_SECRET` is correct
- Check user exists in database
- Verify endpoint URL is correct
- Check server logs for detailed errors

---

## Next Steps After Testing

1. ✅ Document any issues found
2. ✅ Verify all emails match brand guidelines
3. ✅ Test in production before full rollout
4. ✅ Monitor email delivery rates
5. ✅ Gather user feedback on new design

---

## Quick Reference: All Test Endpoints

```bash
# Password Reset
POST /api/test-email?to=EMAIL

# Payment Failure (Day 0, 3, 7)
POST /api/test/send-payment-failure-email?userEmail=EMAIL&daysSinceFailure=0
POST /api/test/send-payment-failure-email?userEmail=EMAIL&daysSinceFailure=3
POST /api/test/send-payment-failure-email?userEmail=EMAIL&daysSinceFailure=7

# Streak Recovery
GET /api/test-streak-email?email=EMAIL

# Win-Back (Day 7, 30, 90, 180)
POST /api/test/send-win-back-email?userEmail=EMAIL&daysSinceCancellation=7
POST /api/test/send-win-back-email?userEmail=EMAIL&daysSinceCancellation=30
POST /api/test/send-win-back-email?userEmail=EMAIL&daysSinceCancellation=90
POST /api/test/send-win-back-email?userEmail=EMAIL&daysSinceCancellation=180

# Weekly Summary
GET /api/test/send-weekly-review-email?email=EMAIL
```

**Note:** Protected endpoints (POST) require `Authorization: Bearer YOUR_SECRET` header.

