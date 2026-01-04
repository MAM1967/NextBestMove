# Security Stack Implementation Plan for NextBestMove

**Status:** P2 Priority - Recommended for Launch Hardening Phase  
**Estimated Implementation Time:** 4-6 hours (phased approach)  
**Estimated Monthly Cost:** $0-25 (using free tiers where possible)

---

## Executive Summary

**Current State:**

- ✅ P0 and P1 features complete
- ✅ CI/CD pipeline with GitHub Actions
- ✅ Branch protection rules enabled
- ✅ Observability (GlitchTip/Sentry, Umami)
- ✅ Handles sensitive data (Stripe, Supabase, OAuth tokens)

**Security Gaps:**

- ❌ No dependency vulnerability scanning
- ❌ No static code analysis (SAST)
- ❌ No runtime security scanning (DAST)
- ❌ No automated security checks in CI

**Recommendation:** Implement a **phased security stack** starting with **Phase 1 (Critical)** before launch, then **Phase 2 (Enhanced)** post-launch.

---

## Phase 1: Pre-Launch Critical Security (2-3 hours, $0-10/mo)

**When to implement:** Before "Launch Hardening" phase (after P2 company research feature)

**Priority:** High - Prevents known vulnerabilities from reaching production

### 1.1 Dependency Scanning (GitHub Dependabot) - **START HERE**

**Why:** Catches vulnerable dependencies before they're deployed. Critical for a payment-processing app.

**Implementation:**

- Enable Dependabot in GitHub Settings (5 min setup)
- Add `.github/dependabot.yml` configuration
- Automatic scanning and PR creation
- No API tokens or paid plans needed

**Cost:** $0 (100% free, unlimited)

**Time:** 5 minutes

**Note:** Replaced Snyk with Dependabot because:

- ✅ Free tier has no limitations
- ✅ Built into GitHub (no external service)
- ✅ Automatic PR creation
- ✅ No API token setup required

### 1.2 Basic Static Analysis (Semgrep - Free Alternative to SonarQube)

**Why:** SonarQube setup is complex (self-hosting) or expensive (cloud). Semgrep is free, fast, and GitHub-native.

**Implementation:**

- Use Semgrep's free GitHub Action
- Focus on security rules (OWASP Top 10, injection attacks)
- Fail PRs on high-severity findings
- Skip code quality rules initially (you have ESLint)

**Cost:** $0 (free tier)

**Time:** 45 minutes

### 1.3 npm audit in CI (Backup to Snyk)

**Why:** Built-in, no external service needed. Good backup if Snyk has issues.

**Implementation:**

- Add `npm audit --audit-level=high` to CI
- Fail on high/critical vulnerabilities
- Already have npm in your workflow

**Cost:** $0

**Time:** 15 minutes

**Total Phase 1:** ~2 hours, $0/month

---

## Phase 2: Post-Launch Enhanced Security (2-3 hours, $0-15/mo)

**When to implement:** After launch, during first month of production monitoring

**Priority:** Medium - Adds runtime security and deeper analysis

### 2.1 OWASP ZAP Baseline DAST (Free)

**Why:** Scans your running Vercel Preview deployments for runtime vulnerabilities.

**Implementation:**

- Scan Vercel Preview URLs on PRs
- Fail on high-risk findings
- Upload reports as artifacts

**Cost:** $0 (open-source)

**Time:** 1-2 hours (includes Vercel API integration)

### 2.2 SonarQube (Optional - Only if needed)

**Why:** More comprehensive than Semgrep, but requires setup.

**When to consider:**

- If Semgrep misses issues you care about
- If you want code quality gates (coverage, complexity)
- If you have budget for SonarCloud ($150/mo) or time for self-hosting

**Cost:** $0 (self-hosted) or $150/mo (SonarCloud)

**Time:** 2-3 hours (self-hosting) or 30 min (SonarCloud)

**Total Phase 2:** ~2-3 hours, $0-15/mo

---

## Recommended Implementation Timeline

### Option A: Pre-Launch Security (Recommended)

**Timing:** After P2 "Company research" feature, before "Launch Hardening"

**Week 1:**

- Day 1: Implement Phase 1.1 (Snyk) - 30 min
- Day 1: Implement Phase 1.3 (npm audit) - 15 min
- Day 2: Implement Phase 1.2 (Semgrep) - 45 min
- Day 2: Test with a PR, verify all checks pass
- Day 3: Add to branch protection rules

**Total:** 2-3 hours over 2-3 days

**Benefits:**

- Catches vulnerabilities before launch
- Establishes security baseline
- Minimal cost ($0)
- Fast to implement

### Option B: Post-Launch Security

**Timing:** After launch, during first production month

**Week 1-2:**

- Implement Phase 1 (same as above)
- Monitor for false positives
- Tune rules as needed

**Week 3-4:**

- Implement Phase 2.1 (ZAP DAST)
- Optional: Add SonarQube if needed

**Total:** 4-6 hours over 3-4 weeks

---

## Refined CI Workflow Integration

### Current CI Structure

Your CI has:

- `lint-and-typecheck`
- `unit-tests`
- `integration-tests`
- `e2e-tests`
- `build`
- `all-tests` (aggregator)

### Recommended Security Jobs (Add to `.github/workflows/ci.yml`)

```yaml
# Add after existing jobs, before all-tests

security-deps:
  name: Security (Dependencies)
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: ./web
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: "npm"
        cache-dependency-path: ./web/package-lock.json
    - run: npm ci
    # Snyk (primary)
    - name: Snyk Test
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high
      continue-on-error: false
    # npm audit (backup)
    - name: npm audit
      run: npm audit --audit-level=high
      continue-on-error: true # Don't fail if Snyk already caught it

security-sast:
  name: Security (SAST)
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Semgrep Scan
      uses: returntocorp/semgrep-action@v1
      with:
        config: >-
          p/security
          p/owasp-top-ten
        generateSarif: "1"
        generateGitHubComments: "true"
      continue-on-error: false
    - name: Upload SARIF
      uses: github/codeql-action/upload-sarif@v3
      if: always()
      with:
        sarif_file: semgrep.sarif

# Optional: ZAP DAST (Phase 2)
security-dast:
  name: Security (DAST)
  if: github.event_name == 'pull_request'
  needs: [all-tests, get-vercel-preview-url] # Wait for deployment
  runs-on: ubuntu-latest
  steps:
    - name: ZAP Baseline Scan
      if: needs.get-vercel-preview-url.outputs.url != ''
      run: |
        docker run --rm -t owasp/zap2docker-stable zap-baseline.py \
          -t "${{ needs.get-vercel-preview-url.outputs.url }}" \
          -r zap_report.html \
          -J zap_report.json \
          -m 5
      continue-on-error: true
    - name: Check for High Alerts
      if: always()
      run: |
        if [ ! -f zap_report.json ]; then exit 0; fi
        python3 -c "
        import json, sys
        with open('zap_report.json') as f:
            data = json.load(f)
        highs = [a for site in data.get('site', []) for a in site.get('alerts', []) if a.get('riskcode', 0) >= 3]
        if highs:
            print(f'Found {len(highs)} High alerts')
            sys.exit(1)
        "
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: zap-report
        path: zap_report.*
```

### Update `all-tests` Job

```yaml
all-tests:
  name: All Tests
  needs:
    [
      lint-and-typecheck,
      unit-tests,
      integration-tests,
      e2e-tests,
      build,
      security-deps,
      security-sast,
    ]
  # Add security-dast if implementing Phase 2
  runs-on: ubuntu-latest
  if: always()
  # ... rest of job
```

---

## GitHub Secrets Required

Add to: `https://github.com/MAM1967/NextBestMove/settings/secrets/actions`

**Phase 1 (Required):**

- `SNYK_TOKEN` - Get from https://snyk.io/account/settings/api-tokens

**Phase 2 (Optional):**

- `VERCEL_TOKEN` - For ZAP to scan Preview URLs
- `VERCEL_PROJECT_ID` - Your Vercel project ID
- `VERCEL_TEAM_ID` - If using team account (optional)

**No secrets needed for:**

- Semgrep (free, no auth)
- npm audit (built-in)

---

## Branch Protection Integration

Update your existing rulesets to require:

**Staging Ruleset:**

- ✅ `security-deps` (required)
- ✅ `security-sast` (required)
- ⚠️ `security-dast` (optional - Phase 2)

**Main Ruleset:**

- ✅ `security-deps` (required)
- ✅ `security-sast` (required)
- ⚠️ `security-dast` (optional - Phase 2)

---

## Cost Breakdown

| Tool                | Tier               | Monthly Cost | Notes                                       |
| ------------------- | ------------------ | ------------ | ------------------------------------------- |
| **Snyk**            | Free (Open Source) | $0           | Free for public repos; $25/user for private |
| **Semgrep**         | Free               | $0           | Unlimited scans, GitHub-native              |
| **npm audit**       | Built-in           | $0           | No external service                         |
| **OWASP ZAP**       | Open-source        | $0           | Fully free                                  |
| **SonarQube**       | Self-hosted        | $0           | Or $150/mo for SonarCloud                   |
| **Total (Phase 1)** |                    | **$0**       | All free tools                              |
| **Total (Phase 2)** |                    | **$0-15**    | If using Snyk paid tier                     |

---

## What's Intentionally Omitted (For Now)

- **Full active DAST scans** - Too slow for CI (add as separate nightly job later)
- **Container scanning** - Not using Docker containers
- **Infrastructure as Code scanning** - No Terraform/CloudFormation
- **Secrets scanning** - GitHub already scans for secrets in commits
- **License compliance** - Add later if needed for enterprise customers

---

## Implementation Checklist

### Phase 1: Pre-Launch (2-3 hours)

- [ ] Sign up for Snyk account
- [ ] Generate Snyk API token
- [ ] Add `SNYK_TOKEN` to GitHub Secrets
- [ ] Add `security-deps` job to CI workflow
- [ ] Add `security-sast` job to CI workflow (Semgrep)
- [ ] Test with a PR
- [ ] Add security jobs to branch protection rules
- [ ] Verify all checks pass on test PR

### Phase 2: Post-Launch (2-3 hours)

- [ ] Get Vercel API token
- [ ] Add Vercel secrets to GitHub
- [ ] Create `get-vercel-preview-url` job
- [ ] Add `security-dast` job (ZAP)
- [ ] Test with a PR that triggers Vercel Preview
- [ ] Add to branch protection rules
- [ ] Optional: Set up SonarQube if needed

---

## Recommended Timeline Based on Your Backlog

### Current Status

- ✅ P0: Complete
- ✅ P1: Complete
- 🔄 P2: Starting (Company research next)

### Recommended Security Implementation

**Option 1: Before Launch Hardening (Recommended)**

- **Timing:** After P2 "Company research" feature, before "Launch Hardening"
- **Rationale:**
  - Establishes security baseline before production
  - Catches vulnerabilities in staging
  - Minimal time investment (2-3 hours)
  - Zero cost
- **Action:** Implement Phase 1 only

**Option 2: During Launch Hardening**

- **Timing:** As part of "Launch Hardening" checklist
- **Rationale:**
  - Security is part of launch readiness
  - Can test with production-like data
- **Action:** Implement Phase 1, optionally Phase 2.1

**Option 3: Post-Launch (Not Recommended)**

- **Timing:** After launch, first month
- **Rationale:**
  - Focus on launch first
  - Add security monitoring after
- **Action:** Implement Phase 1 + Phase 2

---

## My Recommendation

**Implement Phase 1 NOW** (before starting next P2 feature):

1. **Time investment:** 2-3 hours (one afternoon)
2. **Cost:** $0
3. **Value:** Prevents known vulnerabilities from reaching production
4. **Risk if delayed:** Vulnerable dependencies could be deployed
5. **Impact:** High - Payment processing app needs security

**Then implement Phase 2 after launch:**

- Once you have real production traffic
- Can tune ZAP rules based on actual usage
- Less urgent than dependency scanning

---

## Quick Start: Phase 1 Implementation

1. **Sign up for Snyk:** https://snyk.io (5 min)
2. **Get token:** Account Settings → API Tokens (2 min)
3. **Add to GitHub Secrets:** `SNYK_TOKEN` (1 min)
4. **Update CI workflow:** Add security jobs (30 min)
5. **Test:** Create test PR (15 min)
6. **Update branch protection:** Add security checks (10 min)

**Total:** ~1 hour for basic security scanning

---

## Next Steps

1. **Decide on timing:** Before next P2 feature or during Launch Hardening?
2. **Start with Phase 1:** Implement dependency + SAST scanning
3. **Test thoroughly:** Create test PRs with vulnerabilities to verify
4. **Add to branch protection:** Require security checks to pass
5. **Monitor results:** Review findings, fix issues, tune rules

---

**Status:** Ready to implement when you are. Phase 1 can be done in one afternoon and provides immediate value.
