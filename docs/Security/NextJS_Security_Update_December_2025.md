# Next.js Security Update - CVE-2025-55184 & CVE-2025-55183

**Date:** December 10, 2025  
**Status:** ⚠️ Action Required  
**Severity:** HIGH (DoS) + MEDIUM (Source Code Exposure)

---

## Security Bulletin

Vercel has issued a security bulletin for two vulnerabilities in React 19 and Next.js:

- **CVE-2025-55184** (HIGH): Denial of Service vulnerability
- **CVE-2025-55183** (MEDIUM): Source Code Exposure vulnerability

**Reference:** [Vercel Security Bulletin](https://vercel.com/kb/bulletin/security-bulletin-cve-2025-55184-and-cve-2025-55183)

---

## Affected Versions

- **React:** 19.0.0 through 19.2.1
- **Next.js:** 13.x, 14.x, 15.x, and 16.x

---

## Vulnerabilities

### CVE-2025-55184 - Denial of Service (HIGH)

A malicious HTTP request can be crafted and sent to any App Router endpoint that, when deserialized, can cause the server process to hang and consume CPU.

### CVE-2025-55183 - Source Code Exposure (MEDIUM)

A malicious HTTP request can be crafted and sent to any App Router endpoint that can return the compiled source code of Server Actions. This could reveal business logic, but would not expose secrets unless they were hardcoded directly into the Server Action's code.

**Note:** Neither vulnerability allows Remote Code Execution.

---

## Vercel Protection

Vercel has deployed WAF rules to automatically protect all projects hosted on Vercel at no cost. However, **immediate upgrades to patched versions are still required**.

---

## Patched Versions

| Current Version | Upgrade To |
|----------------|------------|
| Next.js >=13.3 | 14.2.35 |
| Next.js 14.x | 14.2.35 |
| Next.js 15.0.x | 15.0.7 |
| Next.js 15.1.x | 15.1.11 |
| Next.js 15.2.x | 15.2.8 |
| Next.js 15.3.x | 15.3.8 |
| Next.js 15.4.x | 15.4.10 |
| Next.js 15.5.x | 15.5.9 |
| Next.js 15.x canary | 15.6.0-canary.60 |
| Next.js 16.0.x | 16.0.10 |
| Next.js 16.0.x canary | 16.1.0-canary.19 |

**Note:** Next.js Pages Router applications are not affected.

---

## Upgrade Methods

### Option 1: Automated Upgrade with Vercel Agent

Vercel Agent can automatically detect vulnerable projects and open PRs that upgrade your code to patched versions.

View vulnerable projects in the Vercel security actions dashboard.

### Option 2: Command Line Tool

Run the automated fix tool:

```bash
npx fix-react2shell-next
```

### Option 3: Manual Upgrade

1. Check current version in `package.json`
2. Update to patched version (see table above)
3. Run `npm install` (or `yarn`/`pnpm`/`bun`)
4. Test locally
5. Deploy immediately

---

## Code Freeze Consideration

**Status:** We are currently in a 48-hour code freeze (Dec 10-11, 2025).

**Recommendation:** Security fixes should be deployed immediately, even during code freeze.

**Action Plan:**
1. Check current Next.js version
2. Determine patched version
3. Upgrade and test on staging
4. Deploy to production immediately

---

## Verification

After upgrade:
1. Verify Next.js version in production
2. Check Vercel security actions dashboard
3. Confirm no security warnings
4. Test critical user flows

---

**Status:** ⚠️ Upgrade Required - Check current version and upgrade immediately










