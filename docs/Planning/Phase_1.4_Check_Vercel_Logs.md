# Check Vercel Function Logs for Password Issue

**Status:** Basic Auth prompt works, but password isn't being accepted.

---

## Step 1: Access Vercel Function Logs

1. Go to **Vercel Dashboard** → Your Project
2. Click on **Deployments** tab
3. Click on the **latest staging deployment**
4. Click on **Functions** tab
5. Look for the middleware function (might be listed as a route handler)

**OR**

1. Go to **Vercel Dashboard** → Your Project
2. Click on **Logs** tab (if available)
3. Filter by "staging" or "preview" environment

---

## Step 2: Look for Middleware Logs

After trying to log in (and it fails), look for logs that start with:
```
[Middleware] Basic Auth failed:
```

The log should show:
- `usernameMatch: true/false`
- `passwordMatch: true/false`
- `expectedUserLength: 7`
- `providedUserLength: ?`
- `expectedPassLength: 11`
- `providedPassLength: ?`
- `expectedUserFirstChar: "s"`
- `providedUserFirstChar: ?`
- `expectedPassFirstChar: "J"`
- `providedPassFirstChar: ?`
- `expectedPassCharCodes: [?, ?, ?]` (first 3 characters)
- `providedPassCharCodes: [?, ?, ?]` (first 3 characters)

---

## Step 3: Analyze the Logs

### If `passwordMatch: false` but lengths match:
- **Encoding issue** - Check `expectedPassCharCodes` vs `providedPassCharCodes`
- Special characters might be encoded differently
- Try a password without special characters

### If `providedPassLength` doesn't match `expectedPassLength`:
- **Input issue** - Password being entered incorrectly
- Check for copy/paste issues
- Try typing password manually

### If `providedPassFirstChar` doesn't match `expectedPassFirstChar`:
- **Case sensitivity** - Check if first character case matches
- Or password is completely different

---

## Step 4: Common Issues & Solutions

### Issue: Special Characters
If your password has special characters (`!@#$%^&*()`), they might be encoded differently.

**Solution:**
- Try a password with only letters and numbers first
- If that works, the issue is with special character encoding
- We can fix the encoding handling

### Issue: Hidden Characters
Sometimes passwords have hidden characters (non-printable).

**Solution:**
- Re-enter the password in Vercel (don't copy/paste)
- Use a simple password to test: `test12345`

### Issue: Case Sensitivity
Passwords are case-sensitive.

**Solution:**
- Verify exact case matches
- Check for `J` vs `j` at the start

---

## Quick Test

1. **Temporarily set a simple password:**
   - In Vercel: Set `STAGING_PASS` to `test12345` (11 chars, starts with 't')
   - Redeploy
   - Try logging in with `test12345`
   - If this works, the issue is with your original password's encoding

2. **If simple password works:**
   - The issue is likely special characters in your original password
   - We can fix the encoding handling in the middleware

---

## Share the Logs

After checking the logs, share:
- The `[Middleware] Basic Auth failed:` log output
- This will show exactly what's being compared

---

**The enhanced logging is deployed - check Vercel function logs after trying to log in!**

