# Verify Hardcoded Production Client Secret

## Current Hardcoded Value

In `web/src/lib/calendar/providers.ts` line 141-142:
```typescript
const hardcodedProductionSecret = "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";
```

## How to Verify This is Correct

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/
   - Select your project
   - Go to **APIs & Services** → **Credentials**
   - Find **"NextBestMove"** client (production, NOT "NextBestMove-Test")
   - Client ID should start with: `732850218816-5een...`

2. **Get the Client Secret:**
   - Click on the "NextBestMove" client
   - Find the "Client secrets" section
   - Copy the FULL client secret
   - It should start with: `GOCSPX-...`

3. **Compare with Hardcoded Value:**
   - The hardcoded value is: `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`
   - Does it match what's in Google Cloud Console?

## If the Value is Wrong

If the hardcoded secret doesn't match Google Cloud Console:

1. **Update the code:**
   - Edit `web/src/lib/calendar/providers.ts`
   - Line 141-142: Replace with the correct secret from Google Cloud Console
   - Commit and push

2. **Or verify in Vercel:**
   - Check `PRODUCTION_GOOGLE_CLIENT_SECRET` in Vercel
   - Does it match Google Cloud Console?

## Check Deployment Logs

After connecting calendar, check Vercel logs for:

**Expected log (if hardcoded secret is being used):**
```
🔧 WORKAROUND: Vercel not providing PRODUCTION_GOOGLE_CLIENT_SECRET, using hardcoded value
   Vercel provided (staging): GOCSPX-3zD...
   Using hardcoded production secret: GOCSPX-UDm3Gmo4XLoGH...
```

**If you see this but still get `invalid_client`:**
- The hardcoded secret value is wrong
- Update it to match Google Cloud Console

**If you DON'T see this log:**
- The new deployment isn't being used
- The custom domain might still be pointing to old deployment
- Wait 1-2 minutes and try again








