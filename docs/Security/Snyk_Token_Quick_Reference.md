# Quick Reference: Getting Your Snyk API Token

## Direct Method (Easiest)

**Just go directly to this URL:**
```
https://snyk.io/manage/api-tokens
```

Or try:
```
https://app.snyk.io/manage/api-tokens
```

This should take you directly to the API tokens page where you can:
1. See existing tokens
2. Click "Add API Token" or "Generate Token"
3. Name it: `github-actions-nextbestmove`
4. Copy the token

---

## Alternative: Via Profile Icon

1. Look at the **very top right** of the Snyk page (above the purple sidebar)
2. Click your **profile icon/avatar** (usually shows initials or a circle)
3. Look for "Account Settings" or "User Settings" in the dropdown
4. Then find "API Tokens"

---

## What You're Currently Seeing

You're in the **Organization view** (the purple sidebar with Projects, Dashboard, etc.). 

The API token is in your **personal account settings**, not organization settings.

**Key difference:**
- Left sidebar "Settings" = Organization settings (wrong place)
- Top right profile icon → Account Settings = Personal settings (right place)

---

## Still Can't Find It?

Try the direct URL first: **https://snyk.io/manage/api-tokens**

If that doesn't work, you can also authenticate via CLI:

```bash
npm install -g snyk
snyk auth
```

This will open a browser and create a token for you.

