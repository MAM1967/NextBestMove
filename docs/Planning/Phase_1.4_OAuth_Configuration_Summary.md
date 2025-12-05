# Google OAuth Configuration Summary

**Last Updated:** After fixing production/staging client mismatch

---

## OAuth Client Configuration

### Production Client: "NextBestMove"
- **Client ID:** `732850218816-5een...`
- **Client Secret:** (Production secret from Google Cloud Console)
- **Vercel Scope:** **Production** only
- **Redirect URIs:**
  - `https://nextbestmove.app/auth/callback`
  - `https://nextbestmove.app/api/calendar/callback/google`
- **JavaScript Origins:**
  - `https://nextbestmove.app`

### Staging Client: "NextBestMove-Test"
- **Client ID:** `732850218816-kgrh...`
- **Client Secret:** (Test secret from Google Cloud Console)
- **Vercel Scope:** **Preview** only
- **Redirect URIs:**
  - `https://staging.nextbestmove.app/auth/callback`
  - `https://staging.nextbestmove.app/api/calendar/callback/google`
- **JavaScript Origins:**
  - `https://staging.nextbestmove.app`

---

## Vercel Environment Variables

### Production Scope
- `GOOGLE_CLIENT_ID` = `732850218816-5een...` (NextBestMove)
- `GOOGLE_CLIENT_SECRET` = (NextBestMove production secret)

### Preview Scope (Staging)
- `GOOGLE_CLIENT_ID` = `732850218816-kgrh...` (NextBestMove-Test)
- `GOOGLE_CLIENT_SECRET` = (NextBestMove-Test secret)

---

## Common Issues & Solutions

### Issue: "redirect_uri_mismatch"
**Cause:** Redirect URI not added to the correct OAuth client in Google Cloud Console.

**Solution:**
- Verify redirect URIs are added to the correct client (production vs test)
- Check for typos or trailing slashes
- Wait 1-2 minutes for Google's changes to propagate

### Issue: "deleted_client" or "invalid_client"
**Cause:** Wrong client ID/secret in Vercel environment variables.

**Solution:**
- Verify `GOOGLE_CLIENT_ID` matches the client in Google Cloud Console
- Verify `GOOGLE_CLIENT_SECRET` matches the client secret
- Check that Production scope uses production client, Preview scope uses test client

### Issue: Production using test client ID
**Cause:** Production environment variables set to test client credentials.

**Solution:**
- Update Production-scoped `GOOGLE_CLIENT_ID` to production client ID
- Update Production-scoped `GOOGLE_CLIENT_SECRET` to production client secret
- Redeploy production after changes

---

## Verification Checklist

### Google Cloud Console
- [ ] "NextBestMove" client has production redirect URIs
- [ ] "NextBestMove-Test" client has staging redirect URIs
- [ ] Both clients have correct JavaScript origins

### Vercel Environment Variables
- [ ] Production scope: `GOOGLE_CLIENT_ID` = production client ID
- [ ] Production scope: `GOOGLE_CLIENT_SECRET` = production client secret
- [ ] Preview scope: `GOOGLE_CLIENT_ID` = test client ID
- [ ] Preview scope: `GOOGLE_CLIENT_SECRET` = test client secret

### Testing
- [ ] Production OAuth sign-in works
- [ ] Production calendar connection works
- [ ] Staging OAuth sign-in works
- [ ] Staging calendar connection works

---

## Security Notes

- **Never mix production and staging credentials**
- Production secrets should only be in Production scope
- Staging secrets should only be in Preview scope
- GitHub Actions workflow only syncs secrets to production (not staging)

---

**Configuration Status:** ✅ Fixed - Production and staging now use correct OAuth clients

