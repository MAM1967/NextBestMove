# Group 4.2 Phase 2: Test 6 - No Calendar Connected

## Test 6: Pre-Call Briefs - No Calendar Connected

**Goal:** Verify the pre-call briefs feature handles gracefully when calendar is not connected

### Prerequisites

- [ ] Premium user account (`mcddsl@icloud.com` or another Premium user)
- [ ] Calendar is **NOT** connected (disconnect if needed)
- [ ] Navigate to `/app/plan`

### Test Steps

1. **Disconnect Calendar (if connected):**
   - [ ] Go to Settings → Calendar
   - [ ] Disconnect the calendar connection
   - [ ] Verify calendar is disconnected

2. **Navigate to `/app/plan`:**
   - [ ] Should load the daily plan page
   - [ ] Should NOT show any pre-call brief cards
   - [ ] Should NOT show any errors

3. **Check API Response:**
   - [ ] Open browser DevTools → Network tab
   - [ ] Look for `/api/pre-call-briefs` request
   - [ ] Should return **200 status code**
   - [ ] Response body should include:
     ```json
     {
       "success": true,
       "briefs": [],
       "message": "Connect your calendar to get pre-call briefs"
     }
     ```

4. **Verify No Errors:**
   - [ ] Check browser console for errors
   - [ ] Should be no error messages
   - [ ] Page should render normally

5. **Reconnect Calendar (for next test):**
   - [ ] Go to Settings → Calendar
   - [ ] Reconnect calendar
   - [ ] Verify connection is active

### Expected Results

- ✅ No pre-call brief cards displayed
- ✅ API returns 200 with empty briefs array
- ✅ Helpful message in API response (if displayed)
- ✅ No errors in console
- ✅ Feature doesn't break without calendar
- ✅ Page renders normally

### Verification Commands

```bash
# Test API endpoint directly (as Premium user without calendar)
curl -X GET "http://localhost:3000/api/pre-call-briefs" \
  -H "Cookie: premium-user-auth-cookie"

# Expected: 200 status with empty briefs array and message
```

### Database Check

```sql
-- Verify user has no active calendar connection
SELECT
  u.email,
  cc.provider,
  cc.status,
  cc.connected_at
FROM users u
LEFT JOIN calendar_connections cc ON cc.user_id = u.id
WHERE u.email = 'mcddsl@icloud.com'
  AND (cc.status = 'active' OR cc.status IS NULL);

-- Should show: no active connection (cc.status IS NULL or cc.status != 'active')
```

---

## Quick Test Summary

**What to verify:**

1. No pre-call brief cards appear when calendar is disconnected
2. API returns 200 with empty briefs array
3. No errors or broken UI
4. Helpful message (if displayed)

**Time estimate:** 5-10 minutes

