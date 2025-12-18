# OAuth Token Persistence Test Plan

## Purpose
Verify that OAuth tokens remain stable and connections persist correctly across:
- OAuth client credential changes
- Token refresh operations
- Environment variable updates
- Provider API changes

## Test Scenarios

### Test 1: Token Refresh Persistence
**Goal:** Verify tokens refresh successfully and connections remain active

**Steps:**
1. Connect a Google calendar in staging
2. Wait for access token to expire (or manually trigger refresh)
3. Make a calendar API call (free/busy request)
4. Verify token refreshes automatically
5. Verify connection status remains "active"
6. Verify `last_sync_at` updates

**Expected Result:**
- Token refreshes without user intervention
- Connection status stays "active"
- No error messages shown to user
- Calendar data continues to work

**Test Data:**
- User: Test account with Google calendar
- Duration: Monitor for 1 hour (tokens expire after 1 hour)

---

### Test 2: OAuth Client Mismatch Detection
**Goal:** Verify system detects when OAuth client changes and handles gracefully

**Steps:**
1. Connect a calendar with OAuth Client A
2. Change environment variable to OAuth Client B (simulate client deletion/change)
3. Attempt to refresh token
4. Verify error is detected and connection marked as "expired"
5. Verify user sees helpful error message
6. Verify "Reconnect Calendar" button appears

**Expected Result:**
- Connection status changes to "expired" or "error"
- Error message clearly explains the issue
- User can easily reconnect
- No crashes or blocking errors

**Test Data:**
- Simulate by using wrong client ID in environment
- Or use staging credentials when production token exists

---

### Test 3: Deleted Client Error Handling
**Goal:** Verify "deleted_client" error is handled correctly

**Steps:**
1. Connect a calendar
2. Simulate "deleted_client" error (modify error response or use deleted client)
3. Attempt token refresh
4. Verify connection marked as expired
5. Verify error message includes "deleted_client" handling
6. Verify UI shows reconnect option

**Expected Result:**
- Error message: "OAuth client was deleted: The OAuth client used to connect your calendar has been deleted..."
- Connection status: "expired" or "error"
- Reconnect button visible and functional

---

### Test 4: Token Rotation Persistence
**Goal:** Verify refresh token rotation works correctly

**Steps:**
1. Connect a calendar
2. Note the refresh token (encrypted in DB)
3. Trigger multiple token refreshes
4. Verify new refresh tokens are stored when provided
5. Verify old refresh token is replaced
6. Verify connection continues working after rotation

**Expected Result:**
- New refresh tokens stored when provided by provider
- Old refresh token replaced
- Connection remains active
- No "invalid_grant" errors

---

### Test 5: Cross-Environment Token Persistence
**Goal:** Verify tokens work across staging/production environments

**Steps:**
1. Connect calendar in staging
2. Verify connection works
3. Check that staging uses staging OAuth credentials
4. Verify production uses production OAuth credentials
5. Verify tokens from one environment don't work in the other

**Expected Result:**
- Staging tokens only work with staging OAuth client
- Production tokens only work with production OAuth client
- Clear error messages if mismatch occurs

---

### Test 6: Long-Term Token Stability
**Goal:** Verify tokens remain valid over extended period

**Steps:**
1. Connect a calendar
2. Monitor connection for 7 days
3. Verify automatic token refresh works
4. Verify no manual reconnection required
5. Check logs for refresh operations

**Expected Result:**
- Tokens refresh automatically
- Connection remains active
- No user intervention required
- Logs show successful refresh operations

---

## Automated Test Script

### Manual Test Script (for staging)

```bash
# 1. Connect calendar
# - Go to /app/settings
# - Click "Connect Google"
# - Complete OAuth flow
# - Verify connection shows "Connected"

# 2. Check database
# - Query calendar_connections table
# - Verify status = 'active'
# - Note refresh_token (encrypted)

# 3. Trigger token refresh
# - Make API call: GET /api/calendar/freebusy?date=2025-12-17
# - Check logs for refresh operation
# - Verify new access_token stored

# 4. Simulate deleted_client error
# - Temporarily change GOOGLE_CLIENT_ID to invalid value
# - Trigger token refresh
# - Verify error handling
# - Restore correct client ID

# 5. Verify reconnection
# - Click "Reconnect Calendar"
# - Complete OAuth flow
# - Verify connection restored
```

---

## Monitoring & Logging

### Key Metrics to Monitor

1. **Token Refresh Success Rate**
   - Track successful vs failed refresh attempts
   - Alert if success rate drops below 95%

2. **Error Types**
   - Count occurrences of:
     - `deleted_client`
     - `invalid_client`
     - `invalid_grant`
     - `invalid_request`

3. **Connection Status Distribution**
   - Track percentage of connections in each status:
     - `active`
     - `expired`
     - `error`
     - `disconnected`

4. **Time to Expiration**
   - Monitor how long connections stay active
   - Alert if many connections expire quickly

### Log Queries

```sql
-- Check connection status distribution
SELECT status, COUNT(*) 
FROM calendar_connections 
GROUP BY status;

-- Check recent errors
SELECT provider, status, error_message, updated_at
FROM calendar_connections
WHERE status IN ('expired', 'error')
ORDER BY updated_at DESC
LIMIT 20;

-- Check token refresh frequency
SELECT 
  user_id,
  provider,
  last_sync_at,
  updated_at,
  EXTRACT(EPOCH FROM (updated_at - last_sync_at)) / 3600 as hours_since_sync
FROM calendar_connections
WHERE status = 'active'
ORDER BY last_sync_at DESC;
```

---

## Success Criteria

✅ **Test 1:** Tokens refresh automatically without user intervention  
✅ **Test 2:** OAuth client mismatches are detected and handled gracefully  
✅ **Test 3:** "deleted_client" errors show helpful messages and reconnect option  
✅ **Test 4:** Refresh token rotation works correctly  
✅ **Test 5:** Environment isolation works (staging vs production)  
✅ **Test 6:** Connections remain stable for 7+ days  

---

## Rollback Plan

If tests reveal issues:
1. Review error logs to identify root cause
2. Check OAuth client configuration in Google Cloud Console
3. Verify environment variables are correct
4. Check for token encryption/decryption issues
5. Verify database constraints and triggers

---

## Notes

- **OAuth Client Lifecycle:** Refresh tokens are tied to the OAuth client that issued them. If the client is deleted or changed, all refresh tokens become invalid.
- **Token Rotation:** Google and Microsoft can return new refresh tokens during refresh. Always store new tokens when provided.
- **Environment Isolation:** Staging and production must use different OAuth clients to prevent token conflicts.

