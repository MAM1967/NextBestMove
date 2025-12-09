# Doppler Secret Management Setup Guide

**Purpose:** Replace Vercel environment variables with Doppler for reliable secret management  
**Date:** December 9, 2025  
**Status:** 🔄 Implementation Guide

---

## Overview

This guide sets up **Doppler** to manage secrets externally, removing dependency on Vercel's unreliable environment variable system.

**Architecture:**

- **Vercel:** Continues to handle Next.js hosting and deployment
- **Doppler:** Manages all secrets (Stripe, Google OAuth, etc.)
- **Runtime:** Application fetches secrets from Doppler API on startup

**Benefits:**

- ✅ Reliable secret management
- ✅ No secrets in code or Vercel dashboard
- ✅ Easy secret rotation
- ✅ Centralized secret management
- ✅ Keep Vercel's Next.js features

---

## Step 1: Set Up Doppler Account

### 1.1 Create Account

1. Go to https://doppler.com
2. Sign up for free account
3. Verify email

### 1.2 Create Project

1. Click "New Project"
2. Name: `NextBestMove`
3. Description: `NextBestMove production secrets`
4. Click "Create Project"

### 1.3 Create Configs (Environments)

Create configs for each environment:

1. **Production Config:**

   - Name: `prd`
   - Click "Create Config"

2. **Preview/Staging Config:**

   - Name: `preview`
   - Click "Create Config"

3. **Development Config:**
   - Name: `dev`
   - Click "Create Config"

---

## Step 2: Add Secrets to Doppler

### 2.1 Production Secrets

1. Select `prd` config
2. Click "Add Secret" or use bulk import
3. Add all production secrets:

```bash
# Stripe (Live)
STRIPE_SECRET_KEY=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
STRIPE_PRICE_ID_STANDARD_MONTHLY=price_1ScDH9Irhm12Lbxf8af6p0TK
STRIPE_PRICE_ID_STANDARD_YEARLY=price_1ScDIJIrhm12LbxfF9LZeB5G
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_1ScDJWIrhm12Lbxf2alCQakP
STRIPE_PRICE_ID_PREMIUM_YEARLY=price_1ScDKZIrhm12LbxfcNF3XSsN
STRIPE_WEBHOOK_SECRET=whsec_CAJtnyuTDm3nkxtkgluzYWH3...

# Google OAuth (Production)
GOOGLE_CLIENT_ID=732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Supabase (if needed)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Resend
RESEND_API_KEY=re_...
```

### 2.2 Preview/Staging Secrets

1. Select `stg` config (staging config - separate from production)
2. Add staging secrets (test Stripe keys, staging Google OAuth, etc.)
3. **Add Basic Auth credentials:**
   - `STAGING_USER=staging` (username for staging site protection)
   - `STAGING_PASS=[your-secure-password]` (password for staging site protection)
   
   **Note:** 
   - Staging uses `stg` config in Doppler
   - Production uses `prd` config in Doppler
   - These are synced to Vercel automatically via `sync-doppler-to-vercel-preview.sh` script (uses `stg` config)

### 2.3 Development Secrets

1. Select `dev` config
2. Add local development secrets

---

## Step 3: Install Doppler CLI

### 3.1 Install on Local Machine

**macOS (Homebrew):**

```bash
brew install dopplerhq/cli/doppler
```

**Or using npm:**

```bash
npm install -g doppler-cli
```

### 3.2 Authenticate

```bash
doppler login
```

Follow browser prompts to authenticate.

### 3.3 Link Project

```bash
cd /Users/michaelmcdermott/NextBestMove/web
doppler setup
```

Select:

- Project: `NextBestMove`
- Config: `dev` (for local development)

---

## Step 4: Create Doppler Service Token for Vercel

### 4.1 Generate Service Token

1. Go to Doppler Dashboard
2. Select Project: `NextBestMove`
3. Go to "Access" → "Service Tokens"
4. Click "Generate Service Token"
5. Name: `vercel-production`
6. Config: `prd` (production)
7. Click "Generate"
8. **Copy the token immediately** (you won't see it again)

### 4.2 Generate Preview Token

Repeat for preview:

- Name: `vercel-preview`
- Config: `preview`

---

## Step 5: Install Doppler Vercel Integration (RECOMMENDED - No Code Changes!)

**This is the SIMPLEST approach** - Doppler syncs secrets directly to Vercel automatically. No SDK needed, no code changes required!

### 5.1 Install from Vercel Marketplace

1. Go to [Vercel Marketplace - Doppler](https://vercel.com/marketplace/doppler)
2. Click **"Add Integration"**
3. Authorize Doppler to access your Vercel account
4. Follow the setup wizard

### 5.2 Configure Integration

**Important:** If the integration auto-created a project, you can either:

- **Option A:** Use your existing project (recommended if you already have secrets there)
- **Option B:** Use the auto-created project and add secrets there

**Option A: Use Existing Project (`nextbestmove-prd`)**

1. In Doppler dashboard, go to your **existing project** (e.g., `nextbestmove-prd`)
2. Click **"Integrations"** → **"Vercel"** (or "Add Integration" if not already added)
3. If integration was created with wrong project:
   - Go to **"Integrations"** in the sidebar
   - Find the Vercel integration
   - Click **"Edit"** or **"Remove"** and recreate with correct project
4. Select:
   - **Doppler Project:** `nextbestmove-prd` (your existing project with secrets)
   - **Doppler Config:** `prd` (for production)
   - **Vercel Project:** Your NextBestMove project
   - **Vercel Environment:** Production
5. Click **"Setup Integration"**

**Option B: Use Auto-Created Project (`next-best-move`)**

1. In Doppler dashboard, go to the auto-created project (`next-best-move`)
2. Copy secrets from `nextbestmove-prd`:
   - Go to `nextbestmove-prd` → Select config (e.g., `prd`)
   - Export secrets or manually copy them
   - Go to `next-best-move` → Add secrets
3. Configure integration as in Option A, but use `next-best-move` as the project

**Recommendation:** Use Option A if you already have all secrets in `nextbestmove-prd` - no need to duplicate.

### 5.3 Sync Preview Environment

Repeat for preview:

- **Doppler Config:** `preview`
- **Vercel Environment:** Preview

### 5.4 How It Works

- Doppler automatically syncs secrets to Vercel environment variables
- When you update secrets in Doppler, they sync to Vercel
- Vercel deployments automatically get the synced secrets
- **No code changes needed** - your app uses `process.env` as normal!

**This solves the propagation issue** because Doppler handles the sync, not Vercel.

---

## Alternative: Runtime API Approach (If You Need Dynamic Secrets)

If you need to fetch secrets at runtime (not recommended for most cases), use this approach:

### 5.1 Install Doppler SDK

```bash
cd /Users/michaelmcdermott/NextBestMove/web
npm install doppler-node
```

**Note:** The package name is `doppler-node`, not `@dopplerhq/node`

### 5.2 Create Doppler Client Utility

Create `web/src/lib/secrets/doppler.ts`:

```typescript
// Using doppler-node package
import Doppler from "doppler-node";

let dopplerClient: Doppler | null = null;
let secretsCache: Record<string, string> | null = null;

/**
 * Initialize Doppler client
 */
function getDopplerClient(): Doppler {
  if (!dopplerClient) {
    // Service token from environment (set in Vercel)
    const serviceToken = process.env.DOPPLER_TOKEN;

    if (!serviceToken) {
      throw new Error(
        "DOPPLER_TOKEN is not set. Set this in Vercel environment variables."
      );
    }

    dopplerClient = new Doppler({
      token: serviceToken,
    });

    // Alternative: If using project/config instead of service token
    // dopplerClient = new Doppler({
    //   project: process.env.DOPPLER_PROJECT,
    //   config: process.env.DOPPLER_CONFIG,
    //   token: serviceToken,
    // });
  }

  return dopplerClient;
}

/**
 * Fetch secrets from Doppler (with caching)
 */
export async function getSecrets(): Promise<Record<string, string>> {
  // Return cached secrets if available (cache for 5 minutes)
  if (secretsCache) {
    return secretsCache;
  }

  try {
    const client = getDopplerClient();
    const response = await client.secrets.get();

    // Cache secrets
    secretsCache = response.secrets;

    // Clear cache after 5 minutes
    setTimeout(() => {
      secretsCache = null;
    }, 5 * 60 * 1000);

    return response.secrets;
  } catch (error) {
    console.error("Failed to fetch secrets from Doppler:", error);
    throw new Error("Failed to fetch secrets from Doppler");
  }
}

/**
 * Get a single secret value
 */
export async function getSecret(key: string): Promise<string | undefined> {
  const secrets = await getSecrets();
  return secrets[key];
}

/**
 * Clear secrets cache (useful for testing or after rotation)
 */
export function clearSecretsCache(): void {
  secretsCache = null;
}
```

### 5.3 Create Environment-Aware Secret Loader

Create `web/src/lib/secrets/index.ts`:

```typescript
import { getSecrets, getSecret } from "./doppler";

// Check if we should use Doppler (when DOPPLER_TOKEN is set)
const USE_DOPPLER = !!process.env.DOPPLER_TOKEN;

/**
 * Get secret value with fallback to environment variables
 *
 * Priority:
 * 1. Doppler (if DOPPLER_TOKEN is set)
 * 2. Environment variable (fallback for local dev without Doppler)
 */
export async function getSecretValue(key: string): Promise<string | undefined> {
  if (USE_DOPPLER) {
    try {
      return await getSecret(key);
    } catch (error) {
      console.error(`Failed to get secret ${key} from Doppler:`, error);
      // Fallback to env var if Doppler fails
      return process.env[key];
    }
  }

  // Local development: use env vars directly
  return process.env[key];
}

/**
 * Get all secrets as a record
 */
export async function getAllSecrets(): Promise<Record<string, string>> {
  if (USE_DOPPLER) {
    try {
      return await getSecrets();
    } catch (error) {
      console.error("Failed to get secrets from Doppler:", error);
      // Fallback: return process.env as record
      return process.env as Record<string, string>;
    }
  }

  return process.env as Record<string, string>;
}
```

---

## Step 6: Update Application Code to Use Doppler

### 6.1 Update Stripe Configuration

Update `web/src/lib/billing/stripe.ts`:

```typescript
import { getSecretValue } from "@/lib/secrets";

// Lazy initialization
let stripeInstance: Stripe | null = null;
let stripeKeyCache: string | null = null;

async function getStripeSecretKey(): Promise<string> {
  // Check cache first
  if (stripeKeyCache) {
    return stripeKeyCache;
  }

  // Try Doppler first, fallback to env var
  const key = await getSecretValue("STRIPE_SECRET_KEY");

  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  // Sanitize
  const sanitizedKey = key.trim().replace(/\s+/g, "");

  // Validate
  if (!sanitizedKey.match(/^sk_(test|live)_[a-zA-Z0-9]+$/)) {
    throw new Error(
      `Invalid STRIPE_SECRET_KEY format: ${sanitizedKey.substring(0, 20)}...`
    );
  }

  // Cache
  stripeKeyCache = sanitizedKey;
  return sanitizedKey;
}

export async function getStripe(): Promise<Stripe> {
  if (!stripeInstance) {
    const key = await getStripeSecretKey();

    stripeInstance = new Stripe(key, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

// Update stripe proxy to use async getter
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    // This is a sync proxy, but we need async
    // We'll need to refactor to make this work properly
    // For now, use getStripe() directly in API routes
    throw new Error(
      "Use getStripe() instead of stripe proxy when using Doppler"
    );
  },
});
```

**Note:** This requires refactoring API routes to use `await getStripe()` instead of the `stripe` proxy.

### 6.2 Update API Routes

Example: Update `web/src/app/api/billing/create-checkout-session/route.ts`:

```typescript
import { getStripe } from "@/lib/billing/stripe";

export async function POST(request: NextRequest) {
  // Get Stripe instance (async when using Doppler)
  const stripe = await getStripe();

  // ... rest of the code
}
```

### 6.3 Update Google OAuth Configuration

Similar pattern for `web/src/lib/calendar/providers.ts`:

```typescript
import { getSecretValue } from "@/lib/secrets";

async function getConfiguration(provider: CalendarProvider, hostname?: string) {
  // Fetch secrets from Doppler
  const clientId = await getSecretValue(
    provider === "google" ? "GOOGLE_CLIENT_ID" : "OUTLOOK_CLIENT_ID"
  );
  const clientSecret = await getSecretValue(
    provider === "google" ? "GOOGLE_CLIENT_SECRET" : "OUTLOOK_CLIENT_SECRET"
  );

  // ... rest of configuration logic
}
```

---

## Step 7: Configure Vercel

### 7.1 Set Doppler Service Token

1. Go to Vercel Dashboard
2. Project → Settings → Environment Variables
3. Add for **Production**:

   - Key: `DOPPLER_TOKEN`
   - Value: `<production-service-token-from-step-4.1>`
   - Scope: **Production**

4. Add for **Preview**:
   - Key: `DOPPLER_TOKEN`
   - Value: `<preview-service-token-from-step-4.2>`
   - Scope: **Preview**

### 7.2 Optional: Remove Old Env Vars

Once Doppler is working:

- You can remove `STRIPE_SECRET_KEY`, `GOOGLE_CLIENT_SECRET`, etc. from Vercel
- Keep only `DOPPLER_TOKEN` in Vercel
- All other secrets come from Doppler

---

## Step 8: Local Development Setup

### 8.1 Use Doppler CLI

Run development server with Doppler:

```bash
cd web
doppler run -- npm run dev
```

This injects secrets from Doppler `dev` config into the process.

### 8.2 Or Use .env.local (Fallback)

Keep `.env.local` for local development without Doppler CLI:

```bash
# .env.local (keep for local dev)
STRIPE_SECRET_KEY=sk_test_...
GOOGLE_CLIENT_SECRET=GOCSPX-...
# etc.
```

The code will fallback to `process.env` when `DOPPLER_TOKEN` is not set.

---

## Step 9: Testing

### 9.1 Test Locally

```bash
# With Doppler CLI
cd web
doppler run --config dev -- npm run dev

# Test API routes
curl http://localhost:3000/api/check-env
```

### 9.2 Test Production

1. Deploy to Vercel with `DOPPLER_TOKEN` set
2. Check logs for Doppler connection
3. Test Stripe/Google OAuth functionality
4. Verify secrets are loaded correctly

---

## Step 10: Remove Hardcoded Workarounds

Once Doppler is working:

1. Remove hardcoded secrets from:

   - `web/src/lib/billing/stripe.ts`
   - `web/src/lib/calendar/providers.ts`

2. Remove override logic that checks for test keys in production

3. Clean up code to use Doppler exclusively

---

## Pricing

**Doppler Free Tier:**

- 1 project
- Unlimited secrets
- Unlimited configs
- Team members: 2

**Doppler Team ($12/month):**

- Unlimited projects
- Unlimited secrets
- Unlimited configs
- Team members: unlimited
- Advanced features

**For NextBestMove:** Free tier is sufficient initially.

---

## Benefits of This Approach

✅ **Reliable:** Doppler has a proven track record  
✅ **Secure:** Secrets never in code or Vercel  
✅ **Flexible:** Works with any hosting platform  
✅ **Easy Rotation:** Update secrets in Doppler, clear cache  
✅ **Audit Trail:** Track who accessed/changed secrets  
✅ **Keep Vercel:** Don't lose Vercel's Next.js features

---

## Migration Checklist

- [ ] Set up Doppler account and project
- [ ] Add all secrets to Doppler
- [ ] Install Doppler SDK in application
- [ ] Create secret loader utility
- [ ] Update Stripe code to use Doppler
- [ ] Update Google OAuth code to use Doppler
- [ ] Set `DOPPLER_TOKEN` in Vercel
- [ ] Test locally with Doppler CLI
- [ ] Deploy to Vercel and test
- [ ] Remove hardcoded workarounds
- [ ] Remove old env vars from Vercel (optional)

---

## Troubleshooting

### Secrets not loading

- Check `DOPPLER_TOKEN` is set in Vercel
- Verify service token has correct config access
- Check Doppler logs for errors

### Slow startup

- Secrets are cached for 5 minutes (adjustable)
- First request may be slower

### Local development issues

- Use `doppler run -- npm run dev` to inject secrets
- Or ensure `.env.local` has fallback values

---

## References

- [Doppler Documentation](https://docs.doppler.com/)
- [Doppler Node.js SDK](https://docs.doppler.com/docs/nodejs)
- [Doppler Pricing](https://www.doppler.com/pricing)

---

**Estimated Setup Time:** 2-3 hours  
**Difficulty:** Medium  
**Recommended:** Yes - Best solution for keeping Vercel with reliable secrets
