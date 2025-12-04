# Group 4.2 Phase 1: Pattern Detection Test Checklist

## Test 1: Pattern Detection - Premium User Access ✅ COMPLETE

### Prerequisites

- [x] Logged in as Premium user (`mcddsl@icloud.com` - already set up) ✅
- [x] User has at least 10-15 completed actions over past 90 days ✅
- [x] Navigate to `/app/insights` ✅

### Test Steps

1. **Access Insights Page:**

   - [x] Navigate to `/app/insights` ✅
   - [x] Should see "Pattern Detection" section ✅
   - [x] Should NOT see upgrade prompt ✅

2. **Check Pattern Display:**

   - [x] Patterns load (may take a few seconds) ✅
   - [x] Should see at least one pattern card if user has sufficient activity ✅
   - [x] Each pattern shows:
     - [x] Title (e.g., "Follow-Up Timing", "What Works Best") ✅
     - [x] Insight text (AI-generated or fallback) ✅
     - [x] Confidence score (e.g., "75%", "70%") ✅

3. **Verify Pattern Types:**
   - [x] Check for different pattern types:
     - [x] Day of week performance ✅
     - [x] Follow-up timing ✅
     - [x] Action type conversion ✅
     - [x] Warm re-engagement ✅
   - [x] Not all patterns may appear (depends on user's activity) ✅

### Expected Results

- ✅ Premium user can access insights page ✅
- ✅ Patterns load and display correctly ✅
- ✅ Insight text is readable and relevant ✅
- ✅ No errors in console ✅

### API Endpoint to Verify

```
GET /api/patterns
```

**Expected:** Returns 200 with patterns array

---

## Test 2: Pattern Detection - Standard User Upgrade Prompt ✅ COMPLETE

### Prerequisites

- [x] Logged in as Standard user (different account) ✅
- [x] Navigate to `/app/insights` ✅

### Test Steps

1. **View Insights Page:**

   - [x] Should see "Pattern Detection" section ✅
   - [x] Should see upgrade prompt/message ✅

2. **Check Upgrade Modal:**
   - [x] Click on pattern detection section (if interactive) ✅
   - [x] Should trigger upgrade modal ✅
   - [x] Modal should mention "Pattern Detection" as Premium feature ✅

### Expected Results

- ✅ Standard user sees upgrade prompt ✅
- ✅ Upgrade modal appears when accessing feature ✅
- ✅ Clear messaging about Premium feature ✅

### API Endpoint to Verify

```
GET /api/patterns
```

**Expected:** Returns 402 with `UPGRADE_REQUIRED`

---

## Test 3: Pattern Detection - Insufficient Data ✅ COMPLETE

### Prerequisites

- [x] Logged in as Premium user with minimal activity (< 5 actions) ✅
- [x] Navigate to `/app/insights` ✅

### Test Steps

1. **Check Response:**
   - [x] API should return success with empty patterns array ✅
   - [x] Should show message: "Not enough activity yet to detect meaningful patterns" ✅

### Expected Results

- ✅ No errors ✅
- ✅ Helpful message displayed ✅
- ✅ User understands they need more activity ✅

---

## Quick Verification Commands

### Check if user has enough actions for patterns:

```sql
-- Check action count for Premium user
SELECT
  u.email,
  COUNT(a.id) as total_actions,
  COUNT(CASE WHEN a.state IN ('REPLIED', 'DONE') THEN 1 END) as completed_actions,
  MIN(a.created_at) as first_action,
  MAX(a.created_at) as last_action
FROM users u
LEFT JOIN actions a ON a.user_id = u.id
WHERE u.email = 'mcddsl@icloud.com'
GROUP BY u.email;
```

### Check pattern detection SQL functions exist:

```sql
-- Verify pattern detection functions are installed
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%pattern%';
```

### Test API endpoint directly:

```bash
# As Premium user (with auth cookie)
curl -X GET "http://localhost:3000/api/patterns" \
  -H "Cookie: your-auth-cookie"

# Should return patterns array or empty array with message
```
