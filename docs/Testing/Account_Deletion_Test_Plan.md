# Account Deletion Test Plan

**Component:** Account deletion functionality  
**Date:** January 28, 2025  
**Status:** Ready for Testing

---

## Prerequisites

1. ✅ Supabase service role key is set in Vercel environment variables as `SUPABASE_SERVICE_ROLE_KEY`
2. ✅ Service role key is in JWT format (starts with `eyJ`)
3. ✅ DELETE policy exists for `users` table (migration `202501280007_add_users_delete_policy.sql`)
4. ✅ Latest code is deployed to Vercel

---

## Test Case: Account Deletion Flow

### TC-1: Successful Account Deletion

**Objective:** Verify that account deletion works end-to-end and user cannot sign back in.

**Steps:**

1. Create a test account:
   - Email: `test+delete@example.com` (use a unique email)
   - Password: `testpass123`
   - Name: "Delete Test User"

2. Sign in with the test account

3. Navigate to `/app/settings`

4. Scroll to "Account deletion" section

5. Click "I want to delete my account"

6. Type `DELETE` in the confirmation field

7. Click "Delete my account"

**Expected Results:**

- ✅ Success message appears (or redirect happens)
- ✅ User is signed out
- ✅ User is redirected to `/auth/sign-in?deleted=true`
- ✅ User cannot sign back in with the same credentials
- ✅ Error message: "Invalid login credentials" when attempting to sign in

**Verification Steps:**

1. **Check Vercel logs** for the deletion process:
   - Look for: `✅ Auth user {userId} deleted from Supabase Auth`
   - Look for: `✅ User {userId} successfully deleted from public.users`
   - No errors should appear

2. **Verify in Supabase Dashboard:**
   ```sql
   -- Check that user is deleted from public.users
   SELECT id, email, name 
   FROM users 
   WHERE email = 'test+delete@example.com';
   -- Should return 0 rows
   ```

3. **Verify auth.users deletion:**
   - Go to Supabase Dashboard → Authentication → Users
   - Search for the test email
   - User should NOT exist in the list

4. **Attempt to sign in:**
   - Go to `/auth/sign-in`
   - Enter the deleted account's email and password
   - Should show "Invalid login credentials" error
   - Should NOT allow sign-in

---

## Test Case: Error Handling

### TC-2: Invalid Confirmation Text

**Steps:**

1. Navigate to account deletion section
2. Type something other than `DELETE` (e.g., "delete", "DELETE ", "delete account")
3. Click "Delete my account"

**Expected Results:**

- ✅ Error message: "Please type DELETE to confirm"
- ✅ Account is NOT deleted
- ✅ User remains signed in

---

### TC-3: Missing Service Role Key

**Note:** This test requires temporarily removing the service key (not recommended in production).

**Expected Behavior:**

- If `SUPABASE_SERVICE_ROLE_KEY` is missing:
  - ✅ Error message should indicate service key is not configured
  - ✅ Account deletion should fail gracefully
  - ✅ User should remain signed in
  - ✅ Error should be logged

---

## Edge Cases

### EC-1: User with Active Subscription

**Steps:**

1. Create account with active subscription
2. Attempt to delete account

**Expected Results:**

- ✅ Account deletion should proceed
- ✅ Subscription data should be deleted
- ✅ User cannot sign back in

---

### EC-2: User with Calendar Connections

**Steps:**

1. Create account with connected calendar
2. Attempt to delete account

**Expected Results:**

- ✅ Calendar connections should be deleted
- ✅ Account deletion should proceed
- ✅ User cannot sign back in

---

## Verification Checklist

After running TC-1, verify:

- [ ] User record deleted from `public.users` table
- [ ] User deleted from `auth.users` (check Supabase Dashboard)
- [ ] All related data deleted (pins, actions, plans, summaries, etc.)
- [ ] User cannot sign in with deleted account credentials
- [ ] Vercel logs show successful deletion
- [ ] No errors in browser console
- [ ] Redirect to sign-in page works correctly

---

## Known Issues & Fixes

### Issue: User could sign back in after deletion

**Root Cause:** Service role key was not in JWT format or not properly configured.

**Fix Applied:**
- ✅ Service role key must be JWT format (starts with `eyJ`)
- ✅ Key is configured in Vercel environment variables
- ✅ `deleteUser` call uses correct format: `deleteUser(userId, false)`

### Issue: TypeScript build error

**Root Cause:** `deleteUser` was called with object `{ shouldSoftDelete: false }` instead of boolean.

**Fix Applied:**
- ✅ Changed to: `deleteUser(userId, false)`

---

## Test Results

```
Test Case | Status | Notes
----------|--------|------
TC-1      | ⏳     | Ready for testing
TC-2      | ⏳     | Ready for testing
TC-3      | ⏳     | Ready for testing
EC-1      | ⏳     | Ready for testing
EC-2      | ⏳     | Ready for testing
```

**Status Legend:**
- ✅ Pass
- ❌ Fail
- ⏳ Pending/Not Tested
- ⚠️ Partial/Issues

---

## Next Steps

1. Run TC-1 with a test account
2. Verify all deletion steps complete successfully
3. Confirm user cannot sign back in
4. Check Vercel logs for any errors
5. Update test results above

