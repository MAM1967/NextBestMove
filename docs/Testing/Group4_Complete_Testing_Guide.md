# Group 4 Complete Testing Guide - Premium Features & Upsells

**Date:** January 2025  
**Status:** ✅ Testing Complete  
**Features:**

1. **Group 4.1: Plan Upgrade Triggers** - Pin limit detection, premium feature access checks
2. **Group 4.3: Plan Downgrade Handling** - Downgrade warnings, reactivation windows

---

## Prerequisites

1. **Test User Account** - You'll need at least one test user account
2. **Supabase Access** - To run SQL scripts for test data setup
3. **Stripe Test Mode** - For testing subscription changes
4. **Browser Console** - Open DevTools to check for errors
5. **Stripe Dashboard** - To manually trigger subscription changes (for downgrade tests)

---

## Test User Setup

**Recommended Test User:** `mcddsl@icloud.com` (UUID: `047fa9df-1464-4f69-a906-0166a0d76091`)

You can find your test user with:

```sql
-- Find your test user
SELECT id, email, name, streak_count, last_action_date
FROM users
WHERE email = 'mcddsl@icloud.com';
```

---

## Group 4.1: Plan Upgrade Triggers

### Test 1.1: Pin Limit Hit - Standard Plan User

**Goal:** Verify that Standard plan users see upgrade modal when they hit 10 pin limit

**Setup SQL:**

```sql
-- Set up Standard plan user with exactly 10 pins
-- Replace 'mcddsl@icloud.com' with your test email
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'mcddsl@icloud.com'
  LIMIT 1
),
-- Count current active pins
current_pins AS (
  SELECT COUNT(*) as pin_count
  FROM person_pins
  WHERE user_id = (SELECT user_id FROM user_info)
    AND status = 'ACTIVE'
)
-- If user has < 10 pins, add pins to reach exactly 10
-- If user has > 10 pins, archive excess pins
SELECT
  CASE
    WHEN (SELECT pin_count FROM current_pins) < 10 THEN
      -- Add pins to reach 10
      (SELECT 10 - (SELECT pin_count FROM current_pins))
    ELSE
      -- Archive excess pins
      (SELECT (SELECT pin_count FROM current_pins) - 10)
  END as action_needed;

-- Add pins if needed (run this if count < 10)
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'mcddsl@icloud.com'
  LIMIT 1
),
current_pins AS (
  SELECT COUNT(*) as pin_count
  FROM person_pins
  WHERE user_id = (SELECT user_id FROM user_info)
    AND status = 'ACTIVE'
),
pins_to_add AS (
  SELECT 10 - (SELECT pin_count FROM current_pins) as count
  WHERE (SELECT pin_count FROM current_pins) < 10
)
INSERT INTO person_pins (user_id, name, url, status)
SELECT
  (SELECT user_id FROM user_info),
  'Test Pin ' || generate_series(1, (SELECT count FROM pins_to_add)),
  'https://linkedin.com/in/test-' || generate_series(1, (SELECT count FROM pins_to_add)),
  'ACTIVE'
WHERE EXISTS (SELECT 1 FROM pins_to_add WHERE count > 0);

-- Archive excess pins if needed (run this if count > 10)
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'mcddsl@icloud.com'
  LIMIT 1
),
excess_pins AS (
  SELECT id
  FROM person_pins
  WHERE user_id = (SELECT user_id FROM user_info)
    AND status = 'ACTIVE'
  ORDER BY created_at DESC
  OFFSET 10
)
UPDATE person_pins
SET status = 'ARCHIVED'
WHERE id IN (SELECT id FROM excess_pins);

-- Verify pin count
SELECT
  COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_pins,
  COUNT(*) FILTER (WHERE status = 'ARCHIVED') as archived_pins,
  COUNT(*) as total_pins
FROM person_pins
WHERE user_id = (SELECT id FROM users WHERE email = 'mcddsl@icloud.com');
```

**Test Steps:**

1. **Verify user has Standard plan:**

   ```sql
   -- Check subscription plan
   SELECT
     bs.status,
     bs.metadata->>'plan_type' as plan_type,
     bs.metadata->>'plan_name' as plan_name
   FROM billing_subscriptions bs
   JOIN billing_customers bc ON bc.id = bs.billing_customer_id
   JOIN users u ON u.id = bc.user_id
   WHERE u.email = 'mcddsl@icloud.com'
     AND bs.status = 'active'
   ORDER BY bs.created_at DESC
   LIMIT 1;
   ```

2. **Ensure user has exactly 10 active pins** (run setup SQL above)

3. **Navigate to Pins page** (`/app/pins`)

4. **Click "Pin a Person" button** (floating action button)

**Expected Results:**

- ✅ Upgrade modal appears immediately (before AddPersonModal opens)
- ✅ Modal shows:
  - Title: "You've reached your pin limit"
  - Message: "You're currently using 10 of 10 pins on the Standard plan"
  - Premium plan benefits listed
  - Pricing: "$79/month"
  - "Upgrade to Premium" button
  - "Maybe Later" button
- ✅ AddPersonModal does NOT open
- ✅ Clicking "Upgrade to Premium" redirects to Stripe Checkout
- ✅ Clicking "Maybe Later" closes modal

**Verification:**

```sql
-- Verify pin count is still 10
SELECT COUNT(*) as active_pins
FROM person_pins
WHERE user_id = (SELECT id FROM users WHERE email = 'mcddsl@icloud.com')
  AND status = 'ACTIVE';
```

---

### Test 1.2: Pin Limit Hit - API Enforcement

**Goal:** Verify backend prevents creating pins beyond limit even if frontend check is bypassed

**Setup SQL:**

Same as Test 1.1 - ensure user has exactly 10 active pins

**Test Steps:**

1. **Open browser DevTools** (F12)
2. **Navigate to Network tab**
3. **Navigate to Pins page** (`/app/pins`)
4. **Try to create a pin via API directly:**

```bash
# Get auth token from browser (Application > Cookies > sb-<project>-auth-token)
# Or use browser console:
# await fetch('/api/pins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test Pin', url: 'https://test.com' }) })
```

**Expected Results:**

- ✅ API returns `403 Forbidden`
- ✅ Response body contains:
  ```json
  {
    "error": "Pin limit reached",
    "message": "You've reached your limit of 10 pins on the Standard plan. Upgrade to Premium for unlimited pins.",
    "limitInfo": {
      "canAdd": false,
      "currentCount": 10,
      "limit": 10,
      "plan": "standard"
    }
  }
  ```
- ✅ No new pin is created in database

**Verification:**

```sql
-- Verify no new pin was created
SELECT COUNT(*) as active_pins
FROM person_pins
WHERE user_id = (SELECT id FROM users WHERE email = 'mcddsl@icloud.com')
  AND status = 'ACTIVE';
-- Should still be 10
```

---

### Test 1.3: Premium Plan User - No Pin Limit

**Goal:** Verify Premium plan users can add unlimited pins

**Setup SQL:**

```sql
-- Ensure user has Premium plan
-- First, check current subscription
SELECT
  bs.id,
  bs.status,
  bs.metadata->>'plan_type' as plan_type,
  bs.metadata->>'plan_name' as plan_name
FROM billing_subscriptions bs
JOIN billing_customers bc ON bc.id = bs.billing_customer_id
JOIN users u ON u.id = bc.user_id
WHERE u.email = 'mcddsl@icloud.com'
  AND bs.status = 'active'
ORDER BY bs.created_at DESC
LIMIT 1;

-- If user has Standard plan, you'll need to upgrade via Stripe Dashboard
-- Or create a new Premium subscription via Stripe Checkout
```

**Test Steps:**

1. **Verify user has Premium plan** (run SQL above - plan_type should be 'premium')
2. **Navigate to Pins page** (`/app/pins`)
3. **Add multiple pins** (try adding 5-10 pins)
4. **Verify no upgrade modal appears**

**Expected Results:**

- ✅ No upgrade modal appears
- ✅ Pins can be added without limit
- ✅ AddPersonModal opens normally
- ✅ All pins are saved successfully

**Verification:**

```sql
-- Verify pins were created
SELECT COUNT(*) as total_pins
FROM person_pins
WHERE user_id = (SELECT id FROM users WHERE email = 'mcddsl@icloud.com')
  AND status = 'ACTIVE';
-- Should be > 10
```

---

### Test 1.4: Premium Feature Access Check (Infrastructure)

**Goal:** Verify premium feature access API works correctly

**Note:** Premium features (pattern detection, pre-call briefs, etc.) are not yet implemented, but the infrastructure is in place.

**Test Steps:**

1. **Test API endpoint directly:**

```bash
# Standard plan user
curl -X GET "http://localhost:3000/api/billing/check-premium-feature?feature=pattern_detection" \
  -H "Cookie: sb-<project>-auth-token=<your-token>"

# Expected response for Standard plan:
# { "hasAccess": false }

# Premium plan user
# Expected response:
# { "hasAccess": true }
```

2. **Test with different features:**

```bash
# Test all premium features
for feature in pattern_detection pre_call_briefs content_engine performance_timeline; do
  curl -X GET "http://localhost:3000/api/billing/check-premium-feature?feature=$feature" \
    -H "Cookie: sb-<project>-auth-token=<your-token>"
done
```

**Expected Results:**

- ✅ Standard plan users: `hasAccess: false` for all features
- ✅ Premium plan users: `hasAccess: true` for all features
- ✅ Invalid feature names return `400 Bad Request`
- ✅ Unauthenticated requests return `401 Unauthorized`

---

## Group 4.3: Plan Downgrade Handling

### Test 3.1: Premium → Standard Downgrade with >10 Pins

**Goal:** Verify downgrade warning modal appears when user downgrades with >10 pins

**Setup SQL:**

```sql
-- Set up Premium plan user with >10 pins
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'mcddsl@icloud.com'
  LIMIT 1
)
-- Ensure user has at least 15 active pins
INSERT INTO person_pins (user_id, name, url, status)
SELECT
  (SELECT user_id FROM user_info),
  'Test Pin ' || generate_series(1, 15),
  'https://linkedin.com/in/test-' || generate_series(1, 15),
  'ACTIVE'
ON CONFLICT DO NOTHING;

-- Verify pin count
SELECT COUNT(*) as active_pins
FROM person_pins
WHERE user_id = (SELECT id FROM users WHERE email = 'mcddsl@icloud.com')
  AND status = 'ACTIVE';
-- Should be >= 15
```

**Test Steps:**

1. **Verify user has Premium plan and >10 pins** (run setup SQL)

2. **Downgrade subscription via Stripe Dashboard:**

   - Go to Stripe Dashboard > Customers
   - Find test user's customer
   - Open subscription
   - Change plan from Premium to Standard
   - Save changes

3. **Wait for webhook to process** (or trigger manually if needed)

4. **Refresh app** or navigate to any page

**Expected Results:**

- ✅ DowngradeWarningModal appears automatically
- ✅ Modal shows:
  - Title: "Plan Downgrade Notice"
  - Message: "You've downgraded to the Standard plan, which includes up to 10 pins"
  - Current pin count displayed (e.g., "You currently have 15 active pins")
  - Warning: "You'll need to archive or snooze at least 5 pins"
  - "I Understand" button
  - "Manage Pins Now" button
- ✅ Clicking "I Understand" closes modal and marks warning as shown
- ✅ Clicking "Manage Pins Now" closes modal (user can manually manage pins)

**Verification:**

```sql
-- Check if downgrade was detected
SELECT
  bs.metadata->>'plan_type' as plan_type,
  bs.metadata->>'downgrade_detected_at' as downgrade_detected_at,
  bs.metadata->>'downgrade_warning_shown' as warning_shown,
  bs.metadata->>'downgrade_pin_count' as pin_count_at_downgrade
FROM billing_subscriptions bs
JOIN billing_customers bc ON bc.id = bs.billing_customer_id
JOIN users u ON u.id = bc.user_id
WHERE u.email = 'mcddsl@icloud.com'
  AND bs.status = 'active'
ORDER BY bs.created_at DESC
LIMIT 1;
-- Should show plan_type: 'standard', downgrade_detected_at: timestamp, downgrade_pin_count: 15+
```

---

### Test 3.2: Premium → Standard Downgrade with <10 Pins

**Goal:** Verify no warning modal appears when user downgrades with <10 pins

**Setup SQL:**

```sql
-- Set up Premium plan user with <10 pins
WITH user_info AS (
  SELECT id as user_id
  FROM users
  WHERE email = 'mcddsl@icloud.com'
  LIMIT 1
)
-- Archive excess pins to get below 10
UPDATE person_pins
SET status = 'ARCHIVED'
WHERE user_id = (SELECT user_id FROM user_info)
  AND status = 'ACTIVE'
  AND id IN (
    SELECT id
    FROM person_pins
    WHERE user_id = (SELECT user_id FROM user_info)
      AND status = 'ACTIVE'
    ORDER BY created_at DESC
    OFFSET 8
  );

-- Verify pin count
SELECT COUNT(*) as active_pins
FROM person_pins
WHERE user_id = (SELECT id FROM users WHERE email = 'mcddsl@icloud.com')
  AND status = 'ACTIVE';
-- Should be <= 8
```

**Test Steps:**

1. **Verify user has Premium plan and <10 pins** (run setup SQL)

2. **Downgrade subscription via Stripe Dashboard** (same as Test 3.1)

3. **Wait for webhook to process**

4. **Refresh app** or navigate to any page

**Expected Results:**

- ✅ No DowngradeWarningModal appears
- ✅ User can use app normally
- ✅ Warning is automatically marked as shown (since user is within limit)

**Verification:**

```sql
-- Check downgrade metadata
SELECT
  bs.metadata->>'plan_type' as plan_type,
  bs.metadata->>'downgrade_warning_shown' as warning_shown
FROM billing_subscriptions bs
JOIN billing_customers bc ON bc.id = bs.billing_customer_id
JOIN users u ON u.id = bc.user_id
WHERE u.email = 'mcddsl@icloud.com'
  AND bs.status = 'active'
ORDER BY bs.created_at DESC
LIMIT 1;
-- Should show warning_shown: 'true' (auto-marked since within limit)
```

---

### Test 3.3: Standard → Cancel (7-Day Read-Only + 30-Day Reactivation)

**Goal:** Verify canceled subscriptions enter read-only mode and can be reactivated within 30 days

**Setup SQL:**

```sql
-- Ensure user has Standard plan
-- Check current subscription
SELECT
  bs.id,
  bs.status,
  bs.metadata->>'plan_type' as plan_type
FROM billing_subscriptions bs
JOIN billing_customers bc ON bc.id = bs.billing_customer_id
JOIN users u ON u.id = bc.user_id
WHERE u.email = 'mcddsl@icloud.com'
ORDER BY bs.created_at DESC
LIMIT 1;
```

**Test Steps:**

1. **Cancel subscription via Stripe Dashboard:**

   - Go to Stripe Dashboard > Customers
   - Find test user's customer
   - Open subscription
   - Click "Cancel subscription"
   - Confirm cancellation

2. **Wait for webhook to process** (`customer.subscription.deleted` event)

3. **Check subscription status:**

```sql
-- Verify canceled_at timestamp is stored
SELECT
  bs.status,
  bs.metadata->>'canceled_at' as canceled_at,
  bs.metadata->>'plan_type' as plan_type
FROM billing_subscriptions bs
JOIN billing_customers bc ON bc.id = bs.billing_customer_id
JOIN users u ON u.id = bc.user_id
WHERE u.email = 'mcddsl@icloud.com'
ORDER BY bs.created_at DESC
LIMIT 1;
-- Should show status: 'canceled', canceled_at: timestamp
```

4. **Test read-only mode:**
   - Try to access Daily Plan page
   - Try to create a new pin
   - Try to complete an action

**Expected Results:**

- ✅ Subscription status is `canceled`
- ✅ `canceled_at` timestamp is stored in metadata
- ✅ User enters read-only mode (PaywallOverlay appears)
- ✅ User cannot create pins or complete actions
- ✅ User can view existing data

5. **Test reactivation window (within 30 days):**
   - Go to Stripe Dashboard
   - Reactivate subscription (create new subscription)
   - Wait for webhook to process
   - Verify user regains access

**Expected Results:**

- ✅ User can reactivate within 30 days
- ✅ After reactivation, user regains full access
- ✅ Read-only mode is removed

**Verification:**

```sql
-- Check if reactivation is possible (within 30 days)
SELECT
  bs.status,
  bs.metadata->>'canceled_at' as canceled_at,
  CASE
    WHEN bs.metadata->>'canceled_at' IS NOT NULL
      AND (NOW() - (bs.metadata->>'canceled_at')::timestamp) < INTERVAL '30 days'
    THEN 'Reactivation available'
    ELSE 'Reactivation expired'
  END as reactivation_status
FROM billing_subscriptions bs
JOIN billing_customers bc ON bc.id = bs.billing_customer_id
JOIN users u ON u.id = bc.user_id
WHERE u.email = 'mcddsl@icloud.com'
ORDER BY bs.created_at DESC
LIMIT 1;
```

---

## Edge Cases

### EC-1: User with No Subscription

**Test:** User without subscription tries to add pin

**Expected:** PaywallOverlay appears (not upgrade modal)

---

### EC-2: User Upgrades from Standard to Premium

**Test:** Standard user with 10 pins upgrades to Premium

**Expected:**

- ✅ Upgrade completes successfully
- ✅ User can now add unlimited pins
- ✅ No downgrade warning appears

---

### EC-3: Multiple Downgrade Attempts

**Test:** User downgrades, then tries to downgrade again

**Expected:**

- ✅ Warning only shows once (marked as shown)
- ✅ Subsequent page loads don't show warning

---

### EC-4: Pin Count Changes After Downgrade

**Test:** User downgrades with 15 pins, then archives 6 pins

**Expected:**

- ✅ Warning was already shown (won't show again)
- ✅ User can continue using app (now within limit)

---

## Test Results Template

```
Test Case | Status | Notes
----------|--------|------
4.1.1     | ✅      | Pin limit hit - Standard plan
4.1.2     | ✅      | API enforcement
4.1.3     | ✅      | Premium plan - no limit
4.1.4     | ✅      | Premium feature access API
4.3.1     | ✅      | Downgrade with >10 pins
4.3.2     | ✅      | Downgrade with <10 pins
4.3.3     | ✅      | Standard → Cancel (read-only + reactivation)
EC-1      | ✅      | No subscription user
EC-2      | ✅      | Upgrade Standard → Premium
EC-3      | ✅      | Multiple downgrade attempts
EC-4      | ✅      | Pin count changes after downgrade
```

**Status Legend:**

- ✅ Pass
- ❌ Fail
- ⚠️ Partial/Issues
- ⬜ Not Tested

---

## Troubleshooting

### Issue: Upgrade modal doesn't appear

**Check:**

1. Verify user has Standard plan (not Premium)
2. Verify pin count is exactly 10
3. Check browser console for errors
4. Verify API endpoint `/api/billing/check-pin-limit` returns correct data

### Issue: Downgrade warning doesn't appear

**Check:**

1. Verify downgrade was detected in webhook (check `downgrade_detected_at` in metadata)
2. Verify user has >10 pins
3. Check if warning was already shown (`downgrade_warning_shown: true`)
4. Verify DowngradeWarningChecker component is in app layout

### Issue: Webhook not processing downgrade

**Check:**

1. Verify Stripe webhook is configured correctly
2. Check Vercel logs for webhook processing
3. Verify `customer.subscription.updated` event is being received
4. Check `billing_events` table for webhook events

---

## Quick Test Checklist

- [x] Test 4.1.1: Pin limit hit (Standard plan) ✅
- [x] Test 4.1.2: API enforcement ✅
- [x] Test 4.1.3: Premium plan (no limit) ✅
- [x] Test 4.1.4: Premium feature API ✅
- [x] Test 4.3.1: Downgrade with >10 pins ✅
- [x] Test 4.3.2: Downgrade with <10 pins ✅
- [x] Test 4.3.3: Cancel subscription (read-only + reactivation) ✅

---

**End of Group 4 Testing Guide**
