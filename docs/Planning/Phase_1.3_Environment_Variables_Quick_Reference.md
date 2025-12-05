# Phase 1.3: Environment Variables Quick Reference

**For Vercel Staging Configuration**

---

## ✅ Already Have (Supabase Staging)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://adgiptzbxnzddbgfeuut.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2lwdHpieG56ZGRiZ2ZldXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Nzk0MzIsImV4cCI6MjA4MDQ1NTQzMn0.ux0Hwx3zKUDqjYz1_6nJJqSQ8lHUkezcLl-m8VDZWUQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2lwdHpieG56ZGRiZ2ZldXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg3OTQzMiwiZXhwIjoyMDgwNDU1NDMyfQ.-JUP_rXGxxxyv6Rk0ThtCZYZou_d33zuGJU33xy6eoo
```

---

## 🔧 Need to Configure

### Application
```bash
NEXT_PUBLIC_APP_URL=https://staging.nextbestmove.app
```

### Stripe (Test Mode)
```bash
STRIPE_SECRET_KEY=sk_test_...          # Get from Stripe Dashboard → API Keys (Test mode)
STRIPE_WEBHOOK_SECRET=whsec_...       # Create webhook endpoint for staging
STRIPE_PRICE_ID_STANDARD_MONTHLY=price_...
STRIPE_PRICE_ID_STANDARD_YEARLY=price_...
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_...  # May be "Professional" in Stripe
STRIPE_PRICE_ID_PREMIUM_YEARLY=price_...
```

### Email
```bash
RESEND_API_KEY=re_...                  # Can use same as production
```

### Cron Jobs
```bash
CRON_SECRET=<generate-random-secret>   # Run: openssl rand -hex 32
CRON_JOB_ORG_API_KEY=<your-key>        # If using cron-job.org
```

### Monitoring
```bash
NEXT_PUBLIC_UMAMI_WEBSITE_ID=<create-new-website-in-umami>
NEXT_PUBLIC_GLITCHTIP_DSN=<create-new-project-in-glitchtip>
```

### AI
```bash
OPENAI_API_KEY=sk-...                  # Can use same as production
```

### Calendar OAuth (if testing)
```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
OUTLOOK_TENANT_ID=...
```

### Encryption
```bash
CALENDAR_ENCRYPTION_KEY=...            # Can use same as production
```

### Staging Security (optional)
```bash
STAGING_USER=<username>
STAGING_PASS=<password>
```

---

## 📋 Quick Setup Order

1. **Set Supabase variables** (already have)
2. **Set NEXT_PUBLIC_APP_URL**
3. **Configure Stripe test mode:**
   - Get test API keys
   - Create test products/prices
   - Create webhook endpoint
   - Add all Stripe variables
4. **Set other variables** (Resend, Cron, Monitoring, etc.)
5. **Test deployment**

---

**Scope:** All variables should be scoped to **"Preview"** branch in Vercel

