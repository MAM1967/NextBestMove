# Security Headers Configuration

**Last Updated:** January 2025  
**Purpose:** Reference for security headers to protect against common web vulnerabilities

---

## Overview

Security headers are configured at two levels:
1. **Next.js Application Level** (`web/next.config.ts`) - Applied to all routes
2. **Server Level** (`web/public/.htaccess`) - Additional server-level protections

---

## Next.js Configuration (`web/next.config.ts`)

### Security Headers Applied

The following headers are applied to all routes via Next.js `headers()` function:

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        // Content Security Policy
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'strict-dynamic'", // Allows Next.js scripts safely
            "style-src 'self' 'unsafe-inline'", // Next.js still needs this for CSS
            "img-src 'self' data: https: blob:",
            "font-src 'self' data:",
            // External API connections
            "connect-src 'self' https://*.supabase.co https://api.stripe.com https://checkout.stripe.com https://billing.stripe.com https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com https://login.microsoftonline.com https://graph.microsoft.com https://api.resend.com https://app.glitchtip.com https://cloud.umami.is https://api-gateway.umami.dev",
            // Stripe checkout/billing portal iframes
            "frame-src 'self' https://checkout.stripe.com https://billing.stripe.com https://js.stripe.com",
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join('; ')
        },
        // Anti-clickjacking Protection
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        // Prevent MIME type sniffing
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        // XSS Protection (legacy but harmless)
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        // Referrer Policy
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        // Permissions Policy
        {
          key: 'Permissions-Policy',
          value: 'geolocation=(), microphone=(), camera=()'
        },
        // Strict Transport Security (HTTPS only)
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains'
        }
      ],
    },
  ];
}
```

### Additional Configuration

```typescript
// Remove X-Powered-By header
poweredByHeader: false,
```

---

## Server-Level Configuration (`web/public/.htaccess`)

### Full .htaccess File Contents

```apache
# Security Headers for nextbestmove.app

# Fix Issue 1: Content Security Policy
# Adjust these directives based on your site's needs
Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self';"

# Fix Issue 2: Anti-clickjacking Protection
Header set X-Frame-Options "SAMEORIGIN"

# Fix Issue 3: Remove X-Powered-By header
Header unset X-Powered-By

# Additional Security Headers (Best Practices)
# Prevent MIME type sniffing
Header set X-Content-Type-Options "nosniff"

# Enable XSS protection in browsers
Header set X-XSS-Protection "1; mode=block"

# Referrer Policy - control how much referrer info is shared
Header set Referrer-Policy "strict-origin-when-cross-origin"

# Permissions Policy - control browser features
Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"

# Force HTTPS (if you have SSL enabled)
# Uncomment the lines below if you want to force HTTPS
# <IfModule mod_rewrite.c>
# RewriteEngine On
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
# </IfModule>

# Protect sensitive files
<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>

# Disable directory browsing
Options -Indexes

# Protect wp-config.php (if using WordPress)
<Files wp-config.php>
    Order allow,deny
    Deny from all
</Files>

# Protect .htaccess itself
<Files .htaccess>
    Order allow,deny
    Deny from all
</Files>

# Block access to readme and license files (common targets)
<FilesMatch "^(readme|license|changelog)\.(txt|html)$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

---

## Security Headers Explained

### Content Security Policy (CSP)

**Purpose:** Prevents XSS attacks by controlling which resources can be loaded

**Configuration:**
- `default-src 'self'` - Only allow resources from same origin by default
- `script-src 'self' 'strict-dynamic'` - Allows Next.js scripts safely (more secure than `unsafe-eval`)
- `style-src 'self' 'unsafe-inline'` - Required for Next.js CSS-in-JS
- `connect-src` - Allows API calls to external services:
  - Supabase (`*.supabase.co`)
  - Stripe (`api.stripe.com`, `checkout.stripe.com`, `billing.stripe.com`)
  - Google Calendar (`accounts.google.com`, `www.googleapis.com`, `oauth2.googleapis.com`)
  - Microsoft Graph (`login.microsoftonline.com`, `graph.microsoft.com`)
  - Resend (`api.resend.com`)
  - GlitchTip (`app.glitchtip.com`)
  - Umami (`cloud.umami.is`, `api-gateway.umami.dev`)
- `frame-src` - Allows Stripe checkout/billing portal iframes
- `frame-ancestors 'self'` - Prevents clickjacking

### X-Frame-Options

**Purpose:** Prevents clickjacking attacks

**Value:** `SAMEORIGIN` - Allows framing only from same origin

### X-Content-Type-Options

**Purpose:** Prevents MIME type sniffing attacks

**Value:** `nosniff` - Browser must respect declared content type

### X-XSS-Protection

**Purpose:** Legacy XSS protection (modern browsers use CSP)

**Value:** `1; mode=block` - Enable XSS filtering

### Referrer-Policy

**Purpose:** Controls how much referrer information is shared

**Value:** `strict-origin-when-cross-origin` - Only send origin (not full URL) when crossing origins

### Permissions-Policy

**Purpose:** Controls browser feature access

**Value:** `geolocation=(), microphone=(), camera=()` - Disable geolocation, microphone, camera

### Strict-Transport-Security (HSTS)

**Purpose:** Forces HTTPS connections

**Value:** `max-age=31536000; includeSubDomains` - Force HTTPS for 1 year, including subdomains

---

## External API Domains Reference

### Supabase
- `*.supabase.co` - Database and authentication API

### Stripe
- `api.stripe.com` - Stripe API calls
- `checkout.stripe.com` - Checkout iframe
- `billing.stripe.com` - Billing portal iframe
- `js.stripe.com` - Stripe.js script (if used)

### Google Calendar
- `accounts.google.com` - OAuth authentication
- `www.googleapis.com` - Calendar API
- `oauth2.googleapis.com` - OAuth token exchange

### Microsoft Graph (Outlook)
- `login.microsoftonline.com` - OAuth authentication
- `graph.microsoft.com` - Calendar API

### Resend
- `api.resend.com` - Email API

### GlitchTip
- `app.glitchtip.com` - Error tracking API

### Umami
- `cloud.umami.is` - Analytics script
- `api-gateway.umami.dev` - Analytics API

---

## Adding New External APIs

When adding a new external API or service, update the CSP `connect-src` directive:

1. **Identify the domain(s)** used by the service
2. **Add to `connect-src`** in `web/next.config.ts`:
   ```typescript
   "connect-src 'self' ... https://new-service.com"
   ```
3. **If using iframes**, also add to `frame-src`:
   ```typescript
   "frame-src 'self' ... https://new-service.com"
   ```
4. **Test thoroughly** - Check browser console for CSP violations
5. **Update this document** with the new domain

---

## Testing Security Headers

### Browser DevTools

1. Open DevTools → Network tab
2. Load any page
3. Click on a request → Headers tab
4. Check Response Headers section
5. Verify all security headers are present

### Online Tools

- **SecurityHeaders.com**: https://securityheaders.com/
- **Mozilla Observatory**: https://observatory.mozilla.org/

### Manual Testing

```bash
# Check headers for a specific URL
curl -I https://nextbestmove.app/

# Check specific header
curl -I https://nextbestmove.app/ | grep -i "content-security-policy"
```

---

## Troubleshooting CSP Violations

### Common Issues

1. **External API calls blocked**
   - **Symptom:** API calls fail, console shows CSP violation
   - **Fix:** Add domain to `connect-src` directive

2. **Stripe checkout/billing portal not loading**
   - **Symptom:** Iframe doesn't load
   - **Fix:** Verify `frame-src` includes Stripe domains

3. **Google/Microsoft OAuth not working**
   - **Symptom:** OAuth redirect fails
   - **Fix:** Verify OAuth domains are in `connect-src`

4. **Next.js scripts not loading**
   - **Symptom:** Page doesn't load, console errors
   - **Fix:** Ensure `'strict-dynamic'` is in `script-src`

### Debugging CSP

1. Check browser console for CSP violation reports
2. Look for messages like: `Refused to connect to...`
3. Note which directive is blocking (e.g., `connect-src`, `frame-src`)
4. Add the domain to the appropriate directive

---

## Notes

- **Vercel Deployment:** `.htaccess` files are only used if deploying to Apache servers. Vercel uses Next.js headers configuration.
- **CSP Strict-Dynamic:** This is more secure than `unsafe-eval` and works well with Next.js's script loading strategy.
- **Unsafe-Inline Styles:** Required for Next.js CSS-in-JS. This is acceptable as CSS injection is less dangerous than script injection.
- **HSTS:** Only works over HTTPS. Ensure your site is served over HTTPS before enabling.

---

## References

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Next.js: Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [OWASP: Security Headers](https://owasp.org/www-project-secure-headers/)
- [SecurityHeaders.com](https://securityheaders.com/)

---

_Last updated: January 2025_

