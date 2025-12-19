# OAuth Token Lifetimes and Refresh Strategies

This document details the token lifetime rules for Google Calendar and Microsoft Outlook/Graph Calendar OAuth tokens, and how NextBestMove handles token refresh to maintain persistent connections.

---

## Google Calendar OAuth Tokens

### Access Token
- **Lifetime:** Approximately 1 hour
- **Notes:** Must be refreshed frequently
- **Strategy:** Refresh proactively when expires within 5 minutes

### Refresh Token (Testing)
- **Lifetime:** 7 days
- **Notes:** Most common "auto-expiry" issue in testing environments
- **Strategy:** Refresh before 7-day window expires

### Refresh Token (Production)
- **Lifetime:** Indefinite
- **Notes:** Only expires if revoked or unused for 6 months
- **Strategy:** Refresh access tokens regularly; refresh token should persist indefinitely if used

---

## Microsoft Outlook/Graph Calendar OAuth Tokens

### Access Token
- **Lifetime:** Random between 60-90 minutes (averages 75 minutes)
- **Notes:**
  - Cannot be revoked and remain valid until expiry
  - Can be customized via token lifetime policies (max 24 hours)
  - Returned in API response with `expires_in` field (in seconds)
- **Strategy:** Refresh proactively when expires within 5 minutes

### Refresh Token
- **Default Lifetime:** 24 hours for single-page apps, 90 days for all other scenarios
- **Maximum Validity:** 90 days (cannot be extended via policies)
- **Critical Behavior:** As of January 30, 2021, Microsoft no longer allows configuration of refresh token lifetimes

### Refresh Token Rolling Behavior

**The most important rule for maintaining persistent connections:**

When you use a refresh token to get a new access token, you also receive a **new refresh token** with its own 90-day lifetime, independent of the original token.

**Example:**
- Token A expires on Day 90
- If you use Token A on Day 30 to refresh, you get Token B
- **Token B expires on Day 120** (30 days from now + 90 days)
- The original Token A is still valid until Day 90

### Inactivity Rules

- **Non-persistent session tokens:** Maximum inactive time of 24 hours
- **Persistent session tokens:** Maximum inactive time of 90 days

**Practical implication:**
- If you don't use a refresh token within 90 days, it expires
- Refresh tokens remain valid as long as you use them within 90 days

---

## NextBestMove Token Refresh Strategy

### Current Implementation

1. **On-Demand Refresh (When Calendar is Used)**
   - `getValidAccessToken()` checks if access token expires soon (< 5 minutes)
   - If expires soon or already expired, automatically refreshes
   - Handles both Google and Microsoft tokens

2. **Proactive Refresh (Background Cron Job)**
   - Runs daily at 2 AM UTC
   - Refreshes access tokens expiring within 24 hours
   - Also refreshes already-expired tokens
   - Updates `last_sync_at` on successful refresh

### Recommended Enhancements

For Microsoft's rolling refresh token behavior, we should:

1. **Track Refresh Token Age**
   - Store `refresh_token_issued_at` timestamp
   - Calculate days since last refresh token was issued

2. **Proactive Refresh Token Refresh**
   - For Microsoft: Refresh every 60 days to stay within 90-day window
   - For Google Production: Not needed (indefinite lifetime)
   - For Google Testing: Refresh every 6 days to stay within 7-day window

3. **Handle Rolling Refresh Tokens**
   - When refreshing Microsoft tokens, always store the new refresh token (even if one wasn't requested)
   - Update `refresh_token_issued_at` when new refresh token is received

### Implementation Example

```typescript
const REFRESH_INTERVAL_DAYS = {
  google: {
    testing: 6, // Stay within 7-day limit
    production: null, // Indefinite, no proactive refresh needed
  },
  microsoft: 60, // Stay within 90-day limit
};

async function shouldRefreshRefreshToken(connection: CalendarConnection): boolean {
  const provider = connection.provider;
  
  // Google Production: No proactive refresh needed
  if (provider === "google" && isProduction) {
    return false;
  }
  
  // Check refresh token age
  const lastRefresh = connection.refresh_token_issued_at || connection.created_at;
  const daysSinceRefresh = getDaysSince(lastRefresh);
  
  if (provider === "google" && isTesting) {
    return daysSinceRefresh >= REFRESH_INTERVAL_DAYS.google.testing;
  }
  
  if (provider === "microsoft") {
    return daysSinceRefresh >= REFRESH_INTERVAL_DAYS.microsoft;
  }
  
  return false;
}
```

---

## Key Takeaways

1. **Access Tokens:** Short-lived (1 hour for Google, 60-90 min for Microsoft) - refresh proactively
2. **Google Refresh Tokens:** Indefinite in production, 7 days in testing - refresh before expiry
3. **Microsoft Refresh Tokens:** 90-day rolling tokens - refresh every 60 days to maintain perpetual access
4. **Strategy:** Use refresh tokens regularly to maintain indefinite access without user re-authentication

---

## References

- [Google OAuth 2.0 Token Lifetime](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Graph Token Lifetime](https://learn.microsoft.com/en-us/azure/active-directory/develop/active-directory-configurable-token-lifetimes)
- [Microsoft Refresh Token Rolling Behavior](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow#refresh-the-access-token)

