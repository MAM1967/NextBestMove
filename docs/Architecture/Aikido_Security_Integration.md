# Aikido Security Integration Guide

**For:** NextBestMove  
**Purpose:** Automated security scanning and vulnerability detection  
**Repository:** github.com/MAM1967/NextBestMove

---

## Overview

Aikido Security provides automated security scanning for your codebase, detecting vulnerabilities, dependency issues, and security misconfigurations. This guide explains how to integrate Aikido with your NextBestMove project.

---

## Integration Options

### Option 1: GitHub Integration (Recommended)

**Best for:** Automatic scanning on every PR and push

1. **Connect Repository:**
   - Go to [Aikido Dashboard](https://app.aikido.dev)
   - Navigate to **Integrations** → **GitHub**
   - Click **Connect GitHub**
   - Authorize Aikido to access your repository
   - Select `MAM1967/NextBestMove` repository

2. **Configure Scanning:**
   - Enable automatic scans on:
     - Pull requests
     - Pushes to main/staging branches
     - Scheduled scans (daily/weekly)

3. **Set Up Branch Protection (Optional):**
   - Configure Aikido to block merges if critical vulnerabilities are found
   - Set severity thresholds (e.g., block on High/Critical only)

---

### Option 2: CI/CD Integration (GitHub Actions)

**Best for:** Custom scanning workflows and PR gating

#### Step 1: Get API Credentials

1. Go to Aikido Dashboard → **Integrations** → **API**
2. Click **Generate New Credentials**
3. Copy your **Client ID** and **Client Secret**
4. Store them as GitHub Secrets:
   - `AIKIDO_CLIENT_ID`
   - `AIKIDO_CLIENT_SECRET`

#### Step 2: Create GitHub Actions Workflow

Create `.github/workflows/aikido-scan.yml`:

```yaml
name: Aikido Security Scan

on:
  pull_request:
    branches: [main, staging]
  push:
    branches: [main, staging]
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'

jobs:
  aikido-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Aikido Scan
        uses: aikido-security/aikido-action@v1
        with:
          client-id: ${{ secrets.AIKIDO_CLIENT_ID }}
          client-secret: ${{ secrets.AIKIDO_CLIENT_SECRET }}
          repository-id: ${{ github.repository_id }}
          branch: ${{ github.head_ref || github.ref_name }}
          fail-on-severity: high  # Fail workflow on High/Critical vulnerabilities
```

#### Step 3: Add GitHub Secrets

1. Go to GitHub → Repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - Name: `AIKIDO_CLIENT_ID`
   - Value: Your Aikido Client ID
4. Add:
   - Name: `AIKIDO_CLIENT_SECRET`
   - Value: Your Aikido Client Secret

---

### Option 3: API Integration (Programmatic)

**Best for:** Custom integrations, webhooks, or programmatic access

#### Step 1: Authenticate

```bash
# Get access token
curl -X POST https://app.aikido.dev/api/oauth/token \
  -H "Authorization: Basic $(echo -n 'CLIENT_ID:CLIENT_SECRET' | base64)" \
  -d "grant_type=client_credentials"
```

#### Step 2: Trigger Scan

```bash
# Start a scan for a specific branch
curl -X POST https://app.aikido.dev/api/integrations/continuous_integration/scan/repository \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "repository_id": "YOUR_REPO_ID",
    "branch": "main",
    "scan_type": "full"
  }'
```

#### Step 3: Check Scan Status

```bash
# Get scan results
curl -X GET https://app.aikido.dev/api/integrations/continuous_integration/scan/SCAN_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Recommended Setup for NextBestMove

### Phase 1: Basic Integration (Start Here)

1. **Connect GitHub Repository:**
   - Use Option 1 (GitHub Integration) for automatic scanning
   - No code changes required
   - Scans run automatically on PRs and pushes

2. **Review Initial Scan Results:**
   - Check Aikido dashboard for vulnerabilities
   - Prioritize High/Critical issues
   - Fix security issues incrementally

### Phase 2: CI/CD Integration (After Phase 1)

1. **Add GitHub Actions Workflow:**
   - Create `.github/workflows/aikido-scan.yml`
   - Configure to run on PRs and main branch pushes
   - Set up branch protection rules (optional)

2. **Configure PR Gating:**
   - Block PRs with High/Critical vulnerabilities
   - Allow Medium/Low issues (fix in follow-up PRs)

### Phase 3: Advanced Integration (Optional)

1. **Set Up Webhooks:**
   - Configure Aikido webhooks to notify on critical findings
   - Integrate with Slack/email for alerts

2. **Custom Scanning:**
   - Use API for custom scan triggers
   - Integrate with deployment pipeline

---

## Environment Variables

If using API integration, add to your environment:

```env
# Aikido API (for programmatic access)
AIKIDO_CLIENT_ID=your-client-id
AIKIDO_CLIENT_SECRET=your-client-secret
```

**Note:** Store these as GitHub Secrets if using GitHub Actions, not in `.env.local`.

---

## What Aikido Scans

Aikido automatically scans for:

- ✅ **Dependency Vulnerabilities** (npm packages, known CVEs)
- ✅ **Secrets & Credentials** (API keys, passwords in code)
- ✅ **Security Misconfigurations** (insecure headers, CORS issues)
- ✅ **Code Vulnerabilities** (SQL injection, XSS, etc.)
- ✅ **Infrastructure Issues** (Vercel config, Supabase settings)

---

## Security Best Practices

### 1. Don't Commit Secrets

Aikido will detect secrets in your code. Make sure:

- ✅ Use environment variables for all secrets
- ✅ Add `.env.local` to `.gitignore`
- ✅ Use GitHub Secrets for CI/CD
- ✅ Rotate secrets if accidentally committed

### 2. Review Scan Results Regularly

- Check Aikido dashboard weekly
- Fix High/Critical issues immediately
- Address Medium/Low issues in planned sprints

### 3. Configure Branch Protection

- Require Aikido checks to pass before merging
- Set appropriate severity thresholds
- Allow exceptions for false positives

---

## Troubleshooting

### Issue: Aikido not detecting repository

**Fix:**
1. Verify repository is connected in Aikido dashboard
2. Check repository permissions in GitHub
3. Ensure Aikido GitHub app is installed

### Issue: CI/CD scan failing

**Fix:**
1. Verify GitHub Secrets are set correctly
2. Check workflow file syntax
3. Review Aikido API documentation for latest changes

### Issue: Too many false positives

**Fix:**
1. Configure Aikido to ignore specific patterns
2. Mark false positives in Aikido dashboard
3. Adjust severity thresholds

---

## Resources

- **Aikido Dashboard:** https://app.aikido.dev
- **Aikido API Docs:** https://apidocs.aikido.dev
- **Aikido CI API:** https://help.aikido.dev/cli-for-pr-and-release-gating/aikido-ci-api
- **GitHub Integration:** https://www.aikido.dev/integrations/github

---

## Quick Start Checklist

- [ ] Sign up for Aikido account
- [ ] Connect GitHub repository (Option 1)
- [ ] Review initial scan results
- [ ] Fix High/Critical vulnerabilities
- [ ] (Optional) Set up GitHub Actions workflow
- [ ] (Optional) Configure branch protection
- [ ] (Optional) Set up webhook notifications

---

**Last Updated:** January 2025

