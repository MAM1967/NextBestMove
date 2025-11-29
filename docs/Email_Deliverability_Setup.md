# Email Deliverability Setup Guide

This guide covers setting up email authentication (SPF, DKIM, DMARC) to improve email deliverability and reduce spam filtering.

## Current Status

✅ **DKIM (Domain Verification)** - Configured  
✅ **SPF (Enable Sending)** - Configured  
✅ **DMARC** - Configured (monitoring mode: `p=none`)

## What is DMARC?

DMARC (Domain-based Message Authentication, Reporting, and Conformance) is an email authentication protocol that:

- Aligns SPF and DKIM results
- Tells receiving email servers what to do with emails that fail authentication
- Provides reporting on email authentication failures
- Helps prevent domain spoofing and phishing

**Important:** DMARC helps but doesn't guarantee inbox placement. Spam filters consider many factors including:

- Email content
- Sender reputation
- Recipient engagement
- Domain age and history

## Setting Up DMARC

### Step 1: Add DMARC DNS Record

1. Go to your domain registrar (where you manage DNS for `nextbestmove.app`)
2. Add a new TXT record:

**Record Details:**

- **Type:** TXT
- **Name:** `_dmarc`
- **Content:** `v=DMARC1; p=none; rua=mailto:dmarc@nextbestmove.app`
- **TTL:** Auto (or 3600)

**Explanation:**

- `v=DMARC1` - DMARC version
- `p=none` - Policy: don't reject/quarantine yet (monitoring mode)
- `rua=mailto:dmarc@nextbestmove.app` - Where to send aggregate reports

### Step 2: Start in Monitoring Mode

Start with `p=none` (monitoring mode) to:

- See authentication reports without affecting delivery
- Identify any issues before enforcing
- Build domain reputation

### Step 3: Gradually Enforce

After monitoring for 1-2 weeks with no issues:

1. **Quarantine mode:** Change to `p=quarantine` (emails that fail go to spam)
2. **Reject mode:** Change to `p=reject` (emails that fail are rejected)

**Example for quarantine:**

```
v=DMARC1; p=quarantine; rua=mailto:dmarc@nextbestmove.app; pct=25
```

(The `pct=25` means only apply to 25% of emails initially)

**Example for reject:**

```
v=DMARC1; p=reject; rua=mailto:dmarc@nextbestmove.app
```

## Verifying DMARC Setup

1. Use online tools to verify:

   - [MXToolbox DMARC Check](https://mxtoolbox.com/dmarc.aspx)
   - [DMARC Analyzer](https://www.dmarcanalyzer.com/)

2. Check DNS propagation:

   ```bash
   dig TXT _dmarc.nextbestmove.app
   ```

3. Wait 24-48 hours for DNS propagation

## Other Deliverability Tips

### 1. Domain Reputation

- **Domain age:** New domains have lower reputation (improves over time)
- **Send volume:** Start with low volume and gradually increase
- **Engagement:** High open/click rates improve reputation

### 2. Email Content

- Avoid spam trigger words
- Keep HTML simple and clean
- Include unsubscribe links (we have this)
- Use proper email headers

### 3. Sender Reputation

- Use consistent "from" address
- Send regularly (not sporadically)
- Monitor bounce rates
- Handle unsubscribes promptly

### 4. User Education

- Tell users to check spam folder
- Ask users to mark emails as "Not Spam"
- Add email to contacts/address book
- Whitelist the domain if possible

## Resend-Specific Notes

Resend handles SPF and DKIM automatically when you verify your domain. You still need to add DMARC manually.

**Resend's default setup:**

- SPF: Automatically configured via MX and TXT records
- DKIM: Automatically configured via `resend._domainkey` TXT record
- DMARC: You must add this manually

## Monitoring Email Deliverability

### Resend Dashboard

- Check delivery rates
- Monitor bounce rates
- View open/click rates
- Check spam complaints

### DMARC Reports

- Set up email forwarding for `dmarc@nextbestmove.app`
- Review aggregate reports weekly
- Look for authentication failures
- Adjust policy based on reports

## Troubleshooting

### Emails Still Going to Spam

1. **Check DMARC policy:** Make sure it's not too strict (`p=none` for monitoring)
2. **Verify SPF/DKIM:** Use [MXToolbox](https://mxtoolbox.com/) to verify all records
3. **Check domain reputation:** Use [Sender Score](https://www.senderscore.org/)
4. **Review email content:** Use [Mail-Tester](https://www.mail-tester.com/) to check spam score
5. **Warm up domain:** New domains need time to build reputation

### DMARC Not Working

1. **DNS propagation:** Wait 24-48 hours after adding record
2. **Record format:** Verify TXT record format is correct
3. **Subdomain:** Make sure you're adding to root domain (`_dmarc.nextbestmove.app`)
4. **Check logs:** Review Resend delivery logs for errors

## Next Steps

1. ✅ Add DMARC TXT record to DNS
2. ✅ Start in monitoring mode (`p=none`)
3. ⏳ **Monitor for 1-2 weeks** - Review DMARC reports for authentication failures
4. ⏳ **Set up email forwarding** - Forward `dmarc@nextbestmove.app` to your monitoring email
5. ⏳ **Gradually enforce** - After 1-2 weeks with no issues, move to `p=quarantine` then `p=reject`
6. ⏳ **Monitor Resend dashboard** - Track delivery rates, bounces, and spam complaints

---

_Last updated: January 29, 2025_
