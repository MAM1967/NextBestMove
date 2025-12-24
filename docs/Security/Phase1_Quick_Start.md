# Phase 1 Security Stack - Quick Start Guide

**Time:** ~30 minutes  
**Cost:** $0

---

## Step 1: Get Snyk Token (5 minutes) - OPTIONAL

**Note:** Snyk is optional. The workflow will work with just `npm audit` + `Semgrep`. You can add Snyk later.

**Important:** You need a **Personal API Token** for GitHub Actions.

**Easiest Method:** Use Snyk CLI (recommended):
```bash
npm install -g snyk
snyk auth
```
This opens your browser, authenticates, and shows your token in the terminal.

**Alternative:** See `docs/Security/Snyk_Token_Official_Guide.md` for detailed instructions based on official Snyk documentation.

### Method 1: Via Profile Dropdown (Most Common)

1. Look at the **top right corner** of the Snyk page
2. Click on your **profile icon/avatar** (usually shows your initials or a circle)
3. In the dropdown menu, look for one of these options:
   - **"Account Settings"** or
   - **"User Settings"** or
   - **"My Account"** or
   - **"Settings"** (if it's personal, not organization)
4. Once in your personal account settings, look for **"API Tokens"** in the left sidebar or main content
5. Click **"Generate Token"** or **"Add API Token"**
6. Name it: `github-actions-nextbestmove`
7. Copy the token (you'll only see it once!)

### Method 2: Direct URL

If you can't find it in the UI, try going directly to:
- https://snyk.io/manage/api-tokens
- Or: https://app.snyk.io/manage/api-tokens

### Method 3: Via Snyk CLI (Alternative)

If the web UI doesn't work, you can also get a token via CLI:

```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate (this will open browser and create token)
snyk auth
```

Then copy the token from: https://snyk.io/manage/api-tokens

### What the token looks like:
- Long alphanumeric string: `abc123def456ghi789jkl012...`
- Usually starts with a few letters/numbers
- **NOT** a UUID format

### Troubleshooting:
- If you only see "Organization Settings" → Look for your profile icon in the **top right** (not the left sidebar)
- The left sidebar "Settings" is for the organization, not your personal account
- Try the direct URL: https://snyk.io/manage/api-tokens

---

## Step 2: Add Token to GitHub Secrets (2 minutes)

1. Go to: https://github.com/MAM1967/NextBestMove/settings/secrets/actions
2. Click **"New repository secret"**
3. **Name:** `SNYK_TOKEN`
4. **Value:** Paste the token you copied from Snyk
5. Click **"Add secret"**

---

## Step 3: Test the Security Jobs (20 minutes)

The CI workflow has been updated with security jobs. To test:

1. **Create a test branch:**
   ```bash
   git checkout -b test/security-phase1
   ```

2. **Push the changes:**
   ```bash
   git add .github/workflows/ci.yml
   git commit -m "Add Phase 1 security scanning: Snyk + Semgrep + npm audit"
   git push origin test/security-phase1
   ```

3. **Create a PR to staging:**
   - Go to: https://github.com/MAM1967/NextBestMove/compare/staging...test/security-phase1
   - Create the PR
   - Watch the CI run

4. **Verify security jobs run:**
   - Check the "Checks" tab on the PR
   - You should see:
     - ✅ `security-deps` (Snyk + npm audit)
     - ✅ `security-sast` (Semgrep)
   - Both should pass (unless you have vulnerabilities!)

---

## Step 4: Add to Branch Protection (5 minutes)

Once the PR passes, merge it, then:

1. Go to: https://github.com/MAM1967/NextBestMove/settings/rules
2. Edit **"Protect staging branch"** ruleset
3. Scroll to **"Require status checks to pass"**
4. Expand it
5. Add these checks:
   - ✅ `security-deps`
   - ✅ `security-sast`
6. Save

Repeat for **"Protect main branch"** ruleset.

---

## What Each Job Does

### `security-deps`
- **Snyk:** Scans `package.json` and `package-lock.json` for known vulnerabilities
- **npm audit:** Backup scan using built-in npm tool
- **Fails on:** High or critical vulnerabilities
- **Runs on:** Every PR and push

### `security-sast`
- **Semgrep:** Static code analysis for security issues
- **Scans for:** OWASP Top 10, injection attacks, XSS, etc.
- **Fails on:** High-severity security findings
- **Runs on:** Every PR and push

---

## Troubleshooting

### Snyk fails with "Token not found"
- Verify `SNYK_TOKEN` is added to GitHub Secrets
- Check the secret name matches exactly (case-sensitive)

### Semgrep finds false positives
- Review findings in PR comments
- Can add exclusions in `.semgrepignore` file if needed
- Most findings are legitimate - review carefully

### npm audit fails but Snyk passes
- npm audit is more strict sometimes
- Since it's `continue-on-error: true`, it won't block the PR
- Fix issues found by Snyk first (primary scanner)

---

## Next Steps

After Phase 1 is working:
1. Monitor security findings for 1-2 weeks
2. Fix any vulnerabilities found
3. Tune Semgrep rules if needed
4. Consider Phase 2 (ZAP DAST) after launch

---

**Status:** Ready to test! Get your Snyk token and create a PR.

