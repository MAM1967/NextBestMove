# Security Fixes - December 2025

**Date:** December 9, 2025  
**Status:** ✅ **Deployed to Staging** (pending verification)  
**Priority:** High

---

## Summary

Three security issues identified and fixed:
1. **JWT Secret Exposure** - Hardcoded Supabase service role key in source code
2. **jws Library Vulnerability** - CVE-2025-65945 (signature forgery)
3. **CSP Weaknesses** - Allows unsafe-eval and unsafe-inline scripts

---

## Issue 1: JWT Secret Exposure ⚠️ HIGH SEVERITY

### Problem
Hardcoded Supabase service role key found in `scripts/push-migrations-to-staging.sh`:
```bash
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Risk:** Service role key has full database access. If exposed, attackers could:
- Read/modify/delete any data
- Bypass Row Level Security (RLS)
- Access sensitive user information

### Solution
1. Remove hardcoded key from script
2. Store `SUPABASE_SERVICE_ROLE_KEY` in Doppler (`stg` config)
3. Update script to read from environment variable
4. Add script to `.gitignore` if it contains secrets (already handled)

### Files Changed
- `scripts/push-migrations-to-staging.sh`

### Verification
- [x] Script reads from environment variable ✅
- [x] Key removed from source code ✅
- [ ] Key stored in Doppler `stg` config (⚠️ **ACTION REQUIRED** - see note below)
- [ ] Script works when key is provided via env var (pending Doppler setup)

**⚠️ IMPORTANT:** The script now requires `SUPABASE_SERVICE_ROLE_KEY` to be set in Doppler (`stg` config). The key was synced to Vercel Preview, but you'll need to add it to Doppler for local script execution:

```bash
doppler secrets set SUPABASE_SERVICE_ROLE_KEY="<your-key>" --config stg
```

---

## Issue 2: jws Library Vulnerability ⚠️ HIGH SEVERITY

### Problem
**CVE-2025-65945:** jws library version 4.0.0 vulnerable to signature forgery
- **Severity:** High
- **Impact:** Attacker can forge cryptographic signatures
- **Affected:** `gtoken` (dependency of `googleapis`) uses `jws ^4.0.0`
- **Fixed in:** jws 4.0.1

### Solution
✅ **Already Fixed:** Current installation uses jws 4.0.1 (verified via `npm audit`)
- No action needed - vulnerability already resolved
- `package-lock.json` shows jws 4.0.1 installed

### Files Changed
- None (already using secure version)

### Verification
- [x] `npm audit` shows no jws vulnerabilities ✅
- [x] All dependencies use jws 4.0.1+ ✅

---

## Issue 3: CSP Weaknesses ⚠️ MEDIUM SEVERITY

### Problem
Content Security Policy allows:
- `'unsafe-eval'` - Allows `eval()` and similar functions
- `'unsafe-inline'` - Allows inline scripts

**Risk:** XSS attacks easier to execute if other protections fail.

**Current CSP (line 107 of `next.config.ts`):**
```typescript
"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cloud.umami.is"
```

### Solution
1. Remove `'unsafe-eval'` (Next.js doesn't require it in production)
2. Replace `'unsafe-inline'` with nonces or hashes for Next.js scripts
3. Use `'strict-dynamic'` for Next.js script loading (more secure)
4. Test that Next.js still works correctly

**Recommended CSP:**
```typescript
"script-src 'self' 'strict-dynamic' https://cloud.umami.is"
```

**Note:** `'strict-dynamic'` allows scripts loaded by trusted scripts, which works well with Next.js.

### Files Changed
- `web/next.config.ts`

### Verification
- [x] CSP header doesn't include unsafe-eval ✅
- [x] CSP header doesn't include unsafe-inline ✅ (using strict-dynamic instead)
- [ ] Next.js app loads correctly (pending staging deployment verification)
- [ ] Umami analytics still works (pending staging deployment verification)
- [ ] No console errors related to CSP (pending staging deployment verification)

---

## Implementation Checklist

- [x] Document security issues
- [x] Fix JWT exposure (move to env var)
- [x] Fix jws vulnerability (already resolved - verified)
- [x] Fix CSP weaknesses (remove unsafe directives)
- [x] Deploy to staging ✅
- [ ] Test all fixes on staging (pending Vercel build completion)
- [ ] Verify no regressions (pending staging verification)
- [ ] Add SUPABASE_SERVICE_ROLE_KEY to Doppler `stg` config (for local script execution)

---

## References

- [CSP Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Next.js CSP Configuration](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [jws CVE-2025-65945](https://nvd.nist.gov/vuln/detail/CVE-2025-65945)
- [Supabase Service Role Key Security](https://supabase.com/docs/guides/api/security)

---

## Post-Fix Verification

After fixes are deployed to staging:

1. **JWT Exposure:**
   - Verify script reads from env var
   - Confirm key removed from source code
   - Test script execution with env var

2. **jws Vulnerability:**
   - Run `npm audit` in `web/` directory
   - Verify no jws vulnerabilities reported

3. **CSP:**
   - Check browser DevTools → Network → Response Headers
   - Verify CSP header doesn't include unsafe-eval/unsafe-inline
   - Test app functionality (no CSP errors in console)
   - Verify Umami analytics loads

---

**Last Updated:** December 9, 2025

