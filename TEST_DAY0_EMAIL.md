# Simple Test Instructions - Day 0 Payment Failure Email

## What You Need

1. Your `CRON_SECRET` from Vercel environment variables
2. The test user email: `mcddsl+onboard2@gmail.com`

## Step 1: Deploy the Test Endpoint

The test endpoint file exists at: `web/src/app/api/test/send-day0-email/route.ts`

**Commit and push:**
```bash
git add web/src/app/api/test/send-day0-email/route.ts
git commit -m "Add simple Day 0 email test endpoint"
git push
```

Wait for Vercel to deploy (usually 1-2 minutes).

## Step 2: Test the Endpoint

After deployment, run this command (replace `YOUR_CRON_SECRET` with your actual secret):

```bash
curl "https://nextbestmove.app/api/test/send-day0-email?email=mcddsl+onboard2@gmail.com&secret=YOUR_CRON_SECRET"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Day 0 email sent",
  "user": {
    "id": "cea4b2e8-462f-48bc-a397-5cf92bf3b335",
    "email": "mcddsl+onboard2@gmail.com",
    "name": "..."
  }
}
```

## Step 3: Check Email

Check the inbox for `mcddsl+onboard2@gmail.com`:
- Subject: "Your payment failed — Update to keep your rhythm"
- Should arrive within a few seconds

## Troubleshooting

**If you get "Unauthorized":**
- Check that `CRON_SECRET` is set in Vercel
- Make sure you're using the exact secret value (no extra spaces)

**If you get "User not found":**
- Verify the email is correct: `mcddsl+onboard2@gmail.com`
- Check the user exists in Supabase

**If you get "Failed to send email":**
- Check `RESEND_API_KEY` is set in Vercel
- Check Resend dashboard for delivery status

## Alternative: Use Existing Cron Endpoint Pattern

If the test endpoint doesn't work, you can manually trigger via the payment failure recovery cron (but it won't send Day 0, only Day 3+).


