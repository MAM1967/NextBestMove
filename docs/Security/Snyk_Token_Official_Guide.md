# Getting Your Snyk API Token - Official Method

Based on [Snyk's official documentation](https://docs.snyk.io/snyk-api/rest-api/about-the-rest-api), here's how to get your API token:

---

## Method 1: Via Account Settings (Official Method)

According to Snyk's documentation:

1. **Log in to Snyk**: Go to https://snyk.io and sign in
2. **Click your profile icon** (top right corner)
3. **Select "Account Settings"** from the dropdown
4. **Navigate to the "General" section**
5. **Under "API Token"**, click **"click to show"** to reveal your token
6. **Copy the token** - it will be used for authentication

**Note:** The token is in your **personal Account Settings**, NOT in Organization Settings.

---

## Method 2: Use Snyk CLI (Easiest - Recommended)

If you can't find it in the UI, use the CLI:

```bash
# Install Snyk CLI globally
npm install -g snyk

# Authenticate (opens browser, creates token automatically)
snyk auth
```

After running `snyk auth`:
1. It opens your browser
2. You authorize the CLI
3. The token is displayed in the terminal
4. Copy that token

**The token is also stored in:** `~/.config/configstore/snyk.json`

You can view it with:
```bash
cat ~/.config/configstore/snyk.json | grep -o '"api": "[^"]*"' | cut -d'"' -f4
```

---

## Method 3: Verify Token Works

Once you have the token, test it with the Snyk API:

```bash
# Replace YOUR_TOKEN and YOUR_ORG_ID
curl --request GET \
  --url "https://api.snyk.io/rest/orgs/YOUR_ORG_ID/projects?version=2024-10-15" \
  --header "Content-Type: application/vnd.api+json" \
  --header "Authorization: token YOUR_TOKEN"
```

If you get a 200 response with project data, the token works!

**To get your Organization ID:**
- Go to Organization Settings → General
- Copy the "Organization ID" (UUID format)

---

## Method 4: Alternative - Use REST API Directly

If the GitHub Actions integration doesn't work, we can use the REST API directly in the workflow. However, the `snyk/actions/node` action is simpler and recommended.

---

## For GitHub Actions

Once you have the token:

1. Go to: https://github.com/MAM1967/NextBestMove/settings/secrets/actions
2. Click "New repository secret"
3. Name: `SNYK_TOKEN`
4. Value: Paste your token
5. Save

The workflow will automatically use it via the `snyk/actions/node` action.

---

## Troubleshooting

### "I don't see Account Settings"
- Look for your **profile icon/avatar** in the **top right** (not left sidebar)
- The left sidebar "Settings" is for Organization, not personal account

### "I don't see API Token in General"
- Make sure you're in **Account Settings** (personal), not Organization Settings
- Try the CLI method instead: `npm install -g snyk && snyk auth`

### "Token doesn't work"
- Verify it's a personal API token, not Organization API key
- Check the token format (should be alphanumeric, not UUID)
- Test with the curl command above

---

## Current Workflow Status

Our workflow is already set up to use Snyk:
- ✅ Uses `snyk/actions/node@master` (official GitHub Action)
- ✅ Only runs if `SNYK_TOKEN` secret exists
- ✅ Falls back to `npm audit` if token is missing

**You can proceed without the token** - `npm audit` will still catch vulnerabilities. Add Snyk later when you have the token.

---

## References

- [Snyk REST API Documentation](https://docs.snyk.io/snyk-api/rest-api/about-the-rest-api)
- [Snyk Authentication Documentation](https://docs.snyk.io/snyk-api/rest-api/authentication-for-api)
- [Snyk GitHub Actions](https://github.com/snyk/actions)

