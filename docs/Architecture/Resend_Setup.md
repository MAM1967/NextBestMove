# Resend Email Service Setup

**Service:** Resend  
**Purpose:** Trial reminders, payment failure notifications, win-back campaigns, streak break emails

---

## API Key

**API Key:** `re_G7fJSBZy_KvXeVd3dVRzbNWsFcMXoJSp6`

**⚠️ SECURITY:** This key should be stored in `.env.local` (never committed to git).

---

## Environment Variable

Add to `.env.local`:

```env
RESEND_API_KEY=re_G7fJSBZy_KvXeVd3dVRzbNWsFcMXoJSp6
```

---

## Installation

Install in the `web/` directory (where the Next.js app lives):

```bash
cd web
npm install resend
# or
pnpm add resend
```

---

## Usage Example

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Send trial reminder email
await resend.emails.send({
  from: 'NextBestMove <onboarding@yourdomain.com>',
  to: userEmail,
  subject: '2 days left in your trial',
  html: '<p>Your trial ends in 2 days...</p>',
});
```

---

## Email Templates Needed

1. **Trial Reminders**
   - Day 12: "2 days left in your trial"
   - Day 14: "Last day of trial — Subscribe to keep your rhythm"

2. **Payment Failure Recovery**
   - Day 0: "Your payment failed. Update to keep your rhythm."
   - Day 3: Reminder #2
   - Day 7: "Account moved to read-only — Update to reactivate"
   - Day 14: "Data archived — 30-day window to reactivate"

3. **Streak Break Recovery**
   - Day 3: "Everything okay? Reply and tell me what broke — I read every message."

4. **Win-Back Campaign**
   - Day 7: "What didn't work for you?" (survey)
   - Day 30: "We shipped updates since you left..."
   - Day 90: "Your past data is still here. Reactivate in one click."
   - Day 180: "Should we delete your data or keep it?"

---

## Domain Setup

To send emails from a custom domain:

1. Add domain in Resend dashboard
2. Verify DNS records (SPF, DKIM, DMARC)
3. Update `from` address to use verified domain

For development/testing, you can use Resend's default domain initially.

---

## Rate Limits

Resend free tier: 3,000 emails/month  
Resend paid tiers: Higher limits based on plan

Monitor usage in Resend dashboard.

---

## References

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference/emails/send-email)

