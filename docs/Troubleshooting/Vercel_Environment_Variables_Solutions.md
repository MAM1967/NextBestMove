# Vercel Environment Variables: Issues and Solutions

**Last Updated:** December 8, 2025  
**Status:** 🔄 Active Issue - Workarounds in Place  
**Priority:** High - Blocks production reliability

---

## Problem Summary

Vercel environment variables are not consistently available at runtime in serverless functions, particularly:

1. **Environment-scoped variables not working as expected**
   - `PRODUCTION_GOOGLE_CLIENT_SECRET` set in Production scope is not accessible at runtime
   - Variables with same name but different scopes (Production vs Preview) are not properly isolated
   - `VERCEL_ENV` may not be reliably set to `"production"` in production deployments

2. **Current Workaround Issues**
   - Hardcoded secrets in code (security risk, maintenance burden)
   - Multiple override checks and fallback logic (complexity, potential bugs)
   - Environment detection logic scattered across codebase

---

## Root Cause Analysis

### How Vercel Environment Variables Work

1. **Variable Scopes:**
   - **Production:** Only available when `VERCEL_ENV=production`
   - **Preview:** Available when `VERCEL_ENV=preview` or `development`
   - **Development:** Only in local development
   - **System:** Always available (e.g., `VERCEL_ENV`, `VERCEL_URL`)

2. **Common Issues:**

   **Issue 1: Variable Name Collision**
   - If `GOOGLE_CLIENT_SECRET` exists in both Production and Preview scopes with different values
   - Vercel may use wrong scope or fail to provide correct one
   - Solution: Use different variable names (e.g., `PRODUCTION_GOOGLE_CLIENT_SECRET`)

   **Issue 2: Build-Time vs Runtime**
   - Next.js can access env vars at build time (`NEXT_PUBLIC_*` are embedded)
   - Server-side env vars should be available at runtime, but sometimes aren't
   - Serverless functions run in isolated environments that may not have all env vars

   **Issue 3: Deployment Cache**
   - Old deployments may have cached env vars
   - New deployments might not pick up updated env vars immediately
   - Solution: Force redeploy after env var changes

---

## Current Workaround (Temporary)

We currently use hardcoded production secrets as a fallback when Vercel env vars fail:

**Location:** `web/src/lib/calendar/providers.ts`

```typescript
// WORKAROUND: Hardcoded production secret when env var not available
const hardcodedProductionSecret = "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";
```

**Problems with this approach:**
- ❌ Secrets in source code (security risk)
- ❌ Requires code changes to update secrets
- ❌ Difficult to rotate secrets
- ❌ GitHub secret scanning blocks commits
- ❌ Not scalable for multiple secrets

---

## Recommended Solutions (Prioritized)

### Solution 1: Use Vercel CLI to Set Environment Variables (Immediate)

**Why:** Ensures variables are set correctly with proper scopes

**Steps:**

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Link your project:**
   ```bash
   cd /Users/michaelmcdermott/NextBestMove/web
   vercel link
   ```

4. **Set production-scoped variables:**
   ```bash
   # Production scope only
   vercel env add PRODUCTION_GOOGLE_CLIENT_SECRET production
   # Paste: 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
   
   vercel env add GOOGLE_CLIENT_ID production
   # Paste: 732850218816-5eenvpldj6cd3i1abv18s8udqqs6s9gk.apps.googleusercontent.com
   
   vercel env add GOOGLE_CLIENT_SECRET production
   # Paste: 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
   ```

5. **Verify variables are set:**
   ```bash
   vercel env ls
   ```

6. **Force redeploy to pick up new env vars:**
   ```bash
   vercel --prod
   ```

**Pros:**
- ✅ Uses Vercel's official method
- ✅ Proper scope isolation
- ✅ No code changes needed

**Cons:**
- ⚠️ Still relies on Vercel's env var system
- ⚠️ May still have runtime availability issues

---

### Solution 2: Use Single Variable with Environment Detection (Better)

**Why:** Simplifies logic, reduces chance of scope confusion

**Approach:**
- Use `GOOGLE_CLIENT_SECRET` with different values in Production vs Preview scopes
- Let Vercel provide the correct one based on `VERCEL_ENV`
- Add robust fallback detection

**Steps:**

1. **Set in Vercel Dashboard:**
   - Production scope: `GOOGLE_CLIENT_SECRET` = Production secret
   - Preview scope: `GOOGLE_CLIENT_SECRET` = Staging secret

2. **Update code to detect and log:**
   ```typescript
   // Simple detection with logging
   const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
   const vercelEnv = process.env.VERCEL_ENV;
   const hostname = request.nextUrl.hostname;
   
   // Log for debugging
   console.log('[Env Check]', {
     vercelEnv,
     hostname,
     hasSecret: !!clientSecret,
     secretPrefix: clientSecret?.substring(0, 10),
   });
   
   // Use hostname as ultimate fallback
   if (!clientSecret || (hostname === 'nextbestmove.app' && clientSecret.startsWith('GOCSPX-3zD'))) {
     // Production hostname but staging secret - override
     clientSecret = productionSecret;
   }
   ```

**Pros:**
- ✅ Simpler logic
- ✅ Relies on Vercel's scope system
- ✅ Less code complexity

**Cons:**
- ⚠️ Still may have runtime issues
- ⚠️ Requires careful env var management

---

### Solution 3: External Secret Management Service (Best Long-Term)

**Why:** Professional, scalable, secure secret management

**Options:**

1. **HashiCorp Vault**
   - Self-hosted or cloud (HCP)
   - API-based secret retrieval
   - Automatic rotation support

2. **AWS Secrets Manager**
   - If using AWS infrastructure
   - Integrates with Vercel via API
   - Automatic rotation

3. **Google Secret Manager**
   - Native Google Cloud integration
   - Good if using Google Cloud services
   - Easy rotation

4. **Doppler / Infisical**
   - Developer-friendly secret management
   - Good CLI and API
   - Supports multiple environments

**Implementation Approach:**

```typescript
// Example with API-based secret retrieval
async function getSecret(secretName: string): Promise<string> {
  // Cache secrets to avoid API calls on every request
  if (secretCache[secretName]) {
    return secretCache[secretName];
  }
  
  // Fetch from secret manager API
  const response = await fetch(`https://secret-manager.example.com/secrets/${secretName}`, {
    headers: {
      'Authorization': `Bearer ${process.env.SECRET_MANAGER_TOKEN}`,
    },
  });
  
  const { value } = await response.json();
  secretCache[secretName] = value;
  return value;
}
```

**Pros:**
- ✅ Industry standard
- ✅ Automatic rotation
- ✅ Audit logging
- ✅ No secrets in code
- ✅ Centralized management

**Cons:**
- ⚠️ Additional service dependency
- ⚠️ More complex setup
- ⚠️ Additional cost
- ⚠️ Need to handle API failures

---

### Solution 4: Next.js Runtime Config (Alternative)

**Why:** Next.js native solution that embeds values at build time

**Approach:**
- Use `next.config.js` to inject env vars
- Values are embedded in the build
- Still requires build-time access to secrets

**Implementation:**

```typescript
// next.config.ts
module.exports = {
  serverRuntimeConfig: {
    // Only available on server-side
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  publicRuntimeConfig: {
    // Available on both server and client
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  },
};
```

**Pros:**
- ✅ Native Next.js solution
- ✅ Guaranteed availability

**Cons:**
- ⚠️ Secrets in build artifacts
- ⚠️ Different values require rebuild
- ⚠️ Not ideal for frequently rotating secrets

---

## Immediate Action Plan

### Step 1: Verify Current Vercel Configuration (15 min)

1. **Check Vercel Dashboard:**
   - Go to Project → Settings → Environment Variables
   - Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` exist in Production scope
   - Verify values match Google Cloud Console

2. **Test Environment Variable Access:**
   ```bash
   # Create a test endpoint
   # GET /api/test-env
   # Logs all env vars (sanitized)
   ```

3. **Review Deployment Logs:**
   - Check if env vars are logged during deployment
   - Verify `VERCEL_ENV` is set correctly

### Step 2: Try Vercel CLI Method (30 min)

1. Use Vercel CLI to set variables (Solution 1)
2. Force redeploy
3. Test calendar connection
4. Check logs for env var availability

### Step 3: Implement Better Detection (If Needed)

If CLI method doesn't work, implement Solution 2 with enhanced logging.

### Step 4: Plan Long-Term Solution

- Evaluate secret management services (Solution 3)
- Budget and timeline for implementation
- Migration plan to remove hardcoded secrets

---

## Code Cleanup Needed

Once a solution is working, remove hardcoded secrets:

**Files to update:**
- `web/src/lib/calendar/providers.ts` - Remove all hardcoded secret values
- Remove override logic that's no longer needed
- Simplify environment detection

**Security:**
- Rotate any secrets that were in code
- Update Google Cloud Console secrets
- Remove from git history if needed

---

## Monitoring and Verification

**Add to monitoring:**
- Alert if env vars are missing in production
- Alert if staging secret detected in production
- Log env var availability on each request (rate-limited)

**Verification checklist:**
- [ ] Production env vars accessible at runtime
- [ ] No hardcoded secrets in code
- [ ] Secret rotation process documented
- [ ] Fallback mechanisms tested
- [ ] Monitoring alerts configured

---

## References

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Google OAuth Best Practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)

---

## Stripe Environment Variables Issue (December 2025)

### Problem
Production deployments show `sk_test_...` keys instead of `sk_live_...` keys, even after:
- Setting correct values in Vercel Dashboard
- Force redeploying production
- Waiting for deployment to complete

### Diagnostic
Check production environment:
```bash
curl https://nextbestmove.app/api/check-env | jq '.variables.STRIPE_SECRET_KEY'
```

**Symptoms:**
- `"prefix": "sk_test_..."` (should be `sk_live_...`)
- `"mode": "TEST"` (should be `"LIVE"`)
- `"hasWhitespace": true` (indicates trailing whitespace/newlines)

### Immediate Solutions

**Solution 1: Delete and Recreate Variable (Most Reliable)**

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. **Delete** `STRIPE_SECRET_KEY` from Production scope
3. **Re-add** `STRIPE_SECRET_KEY` with production value:
   - Value: `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`
   - **Important:** Copy-paste directly, no trailing spaces/newlines
   - Scope: **Production** only
4. Repeat for all Stripe price IDs
5. **Force redeploy production:**
   ```bash
   vercel --prod --force
   ```

**Solution 2: Use Vercel CLI**

```bash
# Delete existing variable
vercel env rm STRIPE_SECRET_KEY production

# Add with correct value (will prompt for value)
vercel env add STRIPE_SECRET_KEY production

# Repeat for price IDs
vercel env add STRIPE_PRICE_ID_STANDARD_MONTHLY production
vercel env add STRIPE_PRICE_ID_STANDARD_YEARLY production
vercel env add STRIPE_PRICE_ID_PREMIUM_MONTHLY production
vercel env add STRIPE_PRICE_ID_PREMIUM_YEARLY production

# Force redeploy
vercel --prod --force
```

**Solution 3: Runtime Workaround (Already Implemented)**

The code now includes a runtime workaround in `web/src/lib/billing/stripe.ts`:
- Detects production environment with test keys
- Automatically overrides with hardcoded production keys
- Logs warnings when override occurs

**This is a temporary fix** until Vercel env var propagation is resolved.

### Verification Steps

After redeploy:
1. Wait for deployment to complete (check Vercel dashboard)
2. Check diagnostic endpoint:
   ```bash
   curl https://nextbestmove.app/api/check-env | jq '.variables.STRIPE_SECRET_KEY'
   ```
3. Should see:
   - `"prefix": "sk_live_..."` ✅
   - `"mode": "LIVE"` ✅
   - `"hasWhitespace": false` ✅ (or at least `trimmedPrefix` shows `sk_live_...`)

### Why This Happens

Vercel environment variables are injected at **build time**. Common causes:
1. **Build cache:** Old builds cached with previous env vars
2. **Variable scoping:** Variables set in wrong scope (Preview vs Production)
3. **Whitespace corruption:** Trailing spaces/newlines copied when setting
4. **Timing:** Deployment started before env vars were fully saved

### Prevention

1. **Always delete and recreate** env vars instead of editing (ensures clean state)
2. **Verify scope** is Production (not Preview/Development)
3. **Check for whitespace** before saving (copy-paste carefully)
4. **Force redeploy** after any env var changes
5. **Use Vercel CLI** for more reliable variable management

---

## Related Documents

- `docs/Troubleshooting/Production_OAuth_Diagnosis.md`
- `docs/Troubleshooting/Fix_Production_Google_OAuth.md`
- `docs/Troubleshooting/Verify_PRODUCTION_GOOGLE_CLIENT_SECRET_In_Vercel.md`

