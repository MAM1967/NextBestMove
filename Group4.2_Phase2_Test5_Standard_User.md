# Group 4.2 Phase 2: Test 5 - Standard User Upgrade Prompt

## Test 5: Pre-Call Briefs - Standard User Upgrade Prompt

**Goal:** Verify Standard users see upgrade prompt and cannot access pre-call briefs

### Prerequisites
- [ ] Standard user account (not Premium)
- [ ] Calendar is connected
- [ ] Calendar event with "call" keyword exists (or video conferencing)

### Test Steps

1. **Log in as Standard user**
   - [ ] Use a Standard plan account (not Premium)

2. **Navigate to `/app/plan`**
   - [ ] Should load the daily plan page

3. **Check for Pre-Call Brief Cards:**
   - [ ] Should NOT see pre-call brief cards
   - [ ] Even if calendar events with "call" keyword exist
   - [ ] Even if video conferencing is detected

4. **Check API Response:**
   - [ ] Open browser DevTools → Network tab
   - [ ] Look for `/api/pre-call-briefs` request
   - [ ] Should return **402 status code**
   - [ ] Response body should include:
     ```json
     {
       "error": "Upgrade required",
       "code": "UPGRADE_REQUIRED"
     }
     ```

5. **Check for Upgrade Prompts (if any):**
   - [ ] If user tries to access pre-call briefs feature
   - [ ] Should see upgrade modal or message
   - [ ] Modal should mention "Pre-Call Briefs" as Premium feature

### Expected Results
- ✅ Standard users don't see briefs
- ✅ API returns 402 (Upgrade Required)
- ✅ No errors in console
- ✅ Graceful handling (no broken UI)
- ✅ Upgrade prompt appears if feature is accessed

### Verification Commands

```bash
# Test API endpoint directly (as Standard user)
curl -X GET "http://localhost:3000/api/pre-call-briefs" \
  -H "Cookie: standard-user-auth-cookie"

# Expected: 402 status with UPGRADE_REQUIRED
```

### Database Check

```sql
-- Verify user is on Standard plan
SELECT 
  u.email,
  bs.status,
  bs.metadata->>'plan_type' as plan_type,
  bs.metadata->>'plan_name' as plan_name
FROM users u
JOIN billing_customers bc ON bc.user_id = u.id
JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
WHERE u.email = 'standard-user@example.com'
  AND bs.status IN ('active', 'trialing')
ORDER BY bs.created_at DESC
LIMIT 1;

-- Should show: plan_type = 'standard', plan_name = 'Standard'
```

---

## Quick Test Summary

**What to verify:**
1. Standard user cannot see pre-call briefs
2. API returns 402 status
3. No errors or broken UI
4. Upgrade prompt works (if implemented)

**Time estimate:** 5-10 minutes

