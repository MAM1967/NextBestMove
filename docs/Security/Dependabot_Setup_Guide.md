# GitHub Dependabot Setup Guide

**Free Alternative to Snyk** - No API tokens or paid plans needed!

---

## What is Dependabot?

GitHub Dependabot is a **free, built-in** security tool that:
- ✅ Scans your dependencies for known vulnerabilities
- ✅ Creates PRs to fix security issues automatically
- ✅ Updates dependencies on a schedule
- ✅ Works with npm, Docker, GitHub Actions, and more
- ✅ **100% free** - no limits on free accounts

---

## Setup Steps (5 minutes)

### Step 1: Enable Dependabot Alerts

1. Go to: https://github.com/MAM1967/NextBestMove/settings/security_analysis
2. Under **"Code security and analysis"**, find **"Dependabot alerts"**
3. Click **"Enable"** (if not already enabled)
4. Optionally enable **"Dependabot security updates"** (auto-creates PRs for vulnerabilities)

### Step 2: Verify Configuration

The `.github/dependabot.yml` file is already configured for:
- ✅ Weekly dependency updates (Mondays at 9 AM)
- ✅ npm package ecosystem
- ✅ Grouped updates (reduces PR noise)
- ✅ Limited to 5 open PRs at a time

### Step 3: Test It

1. Push the `dependabot.yml` file to your repo
2. Dependabot will automatically:
   - Scan your dependencies
   - Create alerts for vulnerabilities
   - Open PRs for security updates (if enabled)

---

## How It Works

### Security Alerts
- Dependabot scans your `package.json` and `package-lock.json`
- Creates alerts in the **"Security"** tab of your repo
- Shows severity (Critical, High, Medium, Low)
- Provides fix recommendations

### Automatic Updates
- Runs weekly (Mondays at 9 AM)
- Creates PRs for:
  - Security vulnerabilities (if "Dependabot security updates" enabled)
  - Dependency updates (based on schedule)
- Groups updates to reduce PR noise

### Integration with CI
- Dependabot PRs automatically trigger your CI workflow
- Security alerts appear in the repository's Security tab
- Can be integrated with branch protection rules

---

## Comparison: Dependabot vs Snyk

| Feature | Dependabot | Snyk (Free) |
|---------|-----------|-------------|
| **Cost** | ✅ Free | ✅ Free (limited) |
| **Setup** | ✅ Built-in, 5 min | ⚠️ API token needed |
| **Dependency Scanning** | ✅ Yes | ✅ Yes |
| **Automatic PRs** | ✅ Yes | ✅ Yes |
| **License Scanning** | ✅ Yes | ✅ Yes |
| **Container Scanning** | ✅ Yes | ❌ No (paid) |
| **SAST (Code Scanning)** | ✅ Yes (CodeQL) | ✅ Yes |
| **Dashboard** | ✅ GitHub Security tab | ✅ Snyk dashboard |
| **CI Integration** | ✅ Automatic | ⚠️ Manual setup |

**Verdict:** Dependabot is the better choice for free accounts!

---

## Current Security Stack

With Dependabot replacing Snyk, you now have:

1. **Dependabot** (Free)
   - Dependency vulnerability scanning
   - Automatic security updates
   - License compliance

2. **npm audit** (Free, Built-in)
   - Additional dependency scanning in CI
   - Fails PRs on high/critical vulnerabilities

3. **Semgrep** (Free)
   - Static code analysis (SAST)
   - OWASP Top 10 scanning
   - Security pattern detection

**Total Cost:** $0  
**Coverage:** Comprehensive security scanning

---

## Enabling Code Scanning (Optional)

GitHub also offers **CodeQL** for static analysis (similar to Semgrep):

1. Go to: https://github.com/MAM1967/NextBestMove/settings/security_analysis
2. Enable **"Code scanning"**
3. Choose **"Set up this workflow"**
4. Select **"CodeQL Analysis"**

This adds another layer of security scanning, but Semgrep already covers this.

---

## Troubleshooting

### "Dependabot alerts not showing"
- Make sure Dependabot alerts are enabled in Settings
- Wait a few minutes after enabling (first scan takes time)
- Check the Security tab: https://github.com/MAM1967/NextBestMove/security

### "Dependabot not creating PRs"
- Enable "Dependabot security updates" in Settings
- Check `.github/dependabot.yml` is in the repo
- Verify the schedule hasn't passed yet

### "Too many PRs"
- Adjust `open-pull-requests-limit` in `dependabot.yml`
- Use grouping to combine updates
- Increase schedule interval (e.g., monthly instead of weekly)

---

## Next Steps

1. ✅ Enable Dependabot alerts (Settings → Security analysis)
2. ✅ Push `dependabot.yml` to your repo
3. ✅ Wait for first scan (usually within minutes)
4. ✅ Review alerts in Security tab
5. ✅ Merge Dependabot PRs as they come in

---

## References

- [GitHub Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [Dependabot Alerts](https://docs.github.com/en/code-security/dependabot/dependabot-alerts)

---

**Status:** Ready to use! Just enable it in GitHub Settings.

