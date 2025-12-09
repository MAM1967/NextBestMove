# How to Get Session Cookies for API Testing

**Problem:** Need to authenticate API requests with curl for testing  
**Solution:** Extract cookies from browser after logging in

---

## Method 1: Browser DevTools (Easiest)

### Step 1: Log In

1. Open your browser
2. Go to `https://nextbestmove.app`
3. Log in with your test account

### Step 2: Get Cookies

1. Open Developer Tools (F12 or Cmd+Option+I)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Cookies** → `https://nextbestmove.app`
4. Look for Supabase cookies (usually named like):
   - `sb-xxxxx-auth-token`
   - `sb-xxxxx-auth-token-code-verifier`
   - (xxxxx is your Supabase project ID)

### Step 3: Copy Cookie String

Copy ALL cookie values in this format:
```
sb-xxxxx-auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; sb-xxxxx-auth-token-code-verifier=...
```

**Or** use this JavaScript in the browser console:
```javascript
// Run this in browser console after logging in
document.cookie.split('; ').filter(c => c.includes('auth')).join('; ')
```

---

## Method 2: Network Tab (Copy as cURL)

This is the **easiest** method:

1. Log in to your app
2. Open Developer Tools → **Network** tab
3. Make any authenticated request (like visiting `/app`)
4. Right-click on the request → **Copy** → **Copy as cURL**
5. Paste the command - it will have all the cookies already!

---

## Method 3: Manual Extraction

If you need to build the cookie string manually:

1. Get cookie name-value pairs from DevTools
2. Format as: `name1=value1; name2=value2; name3=value3`
3. Use in curl:
   ```bash
   curl -X POST https://nextbestmove.app/api/billing/create-checkout-session \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-xxxxx-auth-token=value1; sb-xxxxx-auth-token-code-verifier=value2" \
     -d '{"plan": "standard", "interval": "month"}'
   ```

---

## Method 4: Create Test Endpoint (Alternative)

If cookies are too complex, we could create a test endpoint that accepts an Authorization header instead. But the cookie method is standard for Supabase.

---

## Quick Check: Are Cookies Being Sent?

To verify cookies are working:

```bash
# First, get your cookies from browser
# Then test with a simple endpoint that requires auth
curl https://nextbestmove.app/api/billing/customer-portal \
  -X POST \
  -H "Cookie: YOUR_COOKIES_HERE" \
  -v  # -v shows request/response headers
```

Look for:
- ✅ `200 OK` = Cookies are correct
- ❌ `401 Unauthorized` = Cookies missing/wrong

---

## Troubleshooting

**If you still get "Unauthorized":**

1. **Check cookie names:** Make sure you're using the actual cookie names from browser
2. **Check cookie values:** Values must match exactly (no truncation)
3. **Check domain:** Cookies must be for `nextbestmove.app` domain
4. **Check expiry:** Cookies might have expired - log in again
5. **Use Network tab:** Copy as cURL is most reliable

---

**Tip:** Using "Copy as cURL" from Network tab is the easiest and most reliable method!

