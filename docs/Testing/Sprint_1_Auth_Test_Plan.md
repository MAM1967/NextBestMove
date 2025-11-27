# Sprint 1: Authentication Test Plan

**Component:** Supabase Auth pages & profile bootstrap  
**Date:** January 27, 2025  
**Status:** ✅ Testing Complete - All Tests Passed

---

## Prerequisites

Before testing, ensure:

1. ✅ Supabase project is running and accessible
2. ✅ Environment variables are set (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. ✅ Database migrations are applied:
   - `202511260001_initial_schema.sql` (users table)
   - `202501270002_add_users_insert_policy.sql` (RLS policies for user creation)
4. ✅ Dev server is running (`npm run dev`)

---

## Test Cases

### TC-1: Sign Up Flow

**Objective:** Verify new users can create accounts and profiles are bootstrapped correctly.

**Steps:**

1. Navigate to `/` (marketing page)
2. Click "Get started" button
3. Should redirect to `/auth/sign-up`
4. Fill in the form:
   - Name: "Test User"
   - Email: `test+auth@example.com` (use a unique email)
   - Password: `testpass123` (minimum 6 characters)
5. Click "Create account"
6. Should redirect to `/app` (dashboard)

**Expected Results:**

- ✅ User is redirected to dashboard after sign-up
- ✅ User profile is created in `users` table with:
  - `id` matches `auth.users.id`
  - `email` matches sign-up email
  - `name` matches sign-up name
  - `timezone` defaults to `'America/New_York'`
  - `streak_count` is `0`
  - `calendar_connected` is `false`
- ✅ User name/email appears in sidebar
- ✅ Sign-out button is visible

**Database Verification:**

```sql
-- Run in Supabase SQL Editor
SELECT id, email, name, timezone, streak_count, calendar_connected, created_at
FROM users
WHERE email = 'test+auth@example.com';
```

---

### TC-2: Sign In Flow

**Objective:** Verify existing users can sign in.

**Steps:**

1. Navigate to `/` or `/auth/sign-in`
2. Enter credentials from TC-1:
   - Email: `test+auth@example.com`
   - Password: `testpass123`
3. Click "Sign in"
4. Should redirect to `/app`

**Expected Results:**

- ✅ User is redirected to dashboard
- ✅ User name/email appears in sidebar
- ✅ No errors displayed

---

### TC-3: Sign Out Flow

**Objective:** Verify users can sign out.

**Steps:**

1. While signed in, click "Sign out" button in sidebar
2. Should redirect to `/auth/sign-in`

**Expected Results:**

- ✅ User is redirected to sign-in page
- ✅ User session is cleared
- ✅ Attempting to access `/app` redirects back to sign-in

---

### TC-4: Route Protection

**Objective:** Verify `/app` routes are protected.

**Steps:**

1. Sign out (or use incognito/private window)
2. Navigate directly to `/app`
3. Should redirect to `/auth/sign-in?redirect=/app`
4. After signing in, should redirect back to `/app`

**Expected Results:**

- ✅ Unauthenticated users cannot access `/app` routes
- ✅ Redirect preserves intended destination
- ✅ After sign-in, user lands on intended page

---

### TC-5: Auth Page Redirects

**Objective:** Verify authenticated users are redirected away from auth pages.

**Steps:**

1. While signed in, navigate to `/auth/sign-in`
2. Should automatically redirect to `/app`
3. Navigate to `/auth/sign-up`
4. Should automatically redirect to `/app`

**Expected Results:**

- ✅ Authenticated users cannot access sign-in/sign-up pages
- ✅ Automatic redirect to dashboard

---

### TC-6: Error Handling - Invalid Credentials

**Objective:** Verify error messages display for invalid sign-in attempts.

**Steps:**

1. Navigate to `/auth/sign-in`
2. Enter invalid credentials:
   - Email: `wrong@example.com`
   - Password: `wrongpass`
3. Click "Sign in"

**Expected Results:**

- ✅ Error message displays: "Invalid login credentials"
- ✅ User remains on sign-in page
- ✅ Form fields are preserved (email)

---

### TC-7: Error Handling - Duplicate Email

**Objective:** Verify error handling for duplicate email sign-up.

**Steps:**

1. Navigate to `/auth/sign-up`
2. Enter email that already exists (from TC-1)
3. Fill in name and password
4. Click "Create account"

**Expected Results:**

- ✅ Error message displays: "User already registered"
- ✅ User remains on sign-up page
- ✅ Form fields are preserved

---

### TC-8: Error Handling - Weak Password

**Objective:** Verify password validation.

**Steps:**

1. Navigate to `/auth/sign-up`
2. Enter valid email and name
3. Enter password less than 6 characters: `12345`
4. Click "Create account"

**Expected Results:**

- ✅ Browser validation prevents submission (HTML5 `minLength`)
- ✅ Or Supabase returns error if validation bypassed
- ✅ Error message displays if submission attempted

---

### TC-9: User Profile Display

**Objective:** Verify user profile information displays correctly in app layout.

**Steps:**

1. Sign in with a user account
2. Check sidebar at bottom

**Expected Results:**

- ✅ User name displays (or email prefix if name not available)
- ✅ Full email address displays below name
- ✅ Formatting is clean and readable

---

### TC-10: Session Persistence

**Objective:** Verify user session persists across page refreshes.

**Steps:**

1. Sign in
2. Refresh the page (F5 or Cmd+R)
3. Navigate to different `/app` routes

**Expected Results:**

- ✅ User remains signed in after refresh
- ✅ No redirect to sign-in page
- ✅ User info persists in sidebar

---

## Edge Cases

### EC-1: Email Confirmation (if enabled)

- If Supabase email confirmation is enabled, test the confirmation flow
- Verify user cannot access `/app` until email is confirmed

### EC-2: Password Reset (future)

- Document that password reset is not yet implemented
- Add to backlog if needed

### EC-3: Multiple Tabs

- Sign in in one tab
- Open `/app` in another tab
- Sign out in first tab
- Verify second tab redirects on next navigation

---

## Performance Tests

### PT-1: Sign Up Performance

- Measure time from form submission to dashboard load
- Should be < 2 seconds

### PT-2: Sign In Performance

- Measure time from form submission to dashboard load
- Should be < 1 second

---

## Security Checks

### SC-1: RLS Policies

- Verify users can only read their own profile:

```sql
-- As user A, try to read user B's profile
-- Should return empty or error
```

### SC-2: Session Tokens

- Verify cookies are set with `HttpOnly` and `Secure` flags (check in browser DevTools)
- Verify tokens are not exposed in client-side code

### SC-3: SQL Injection

- Test form inputs with SQL-like strings
- Verify no SQL errors or data leakage

---

## Browser Compatibility

Test on:

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Safari (iOS)
- ✅ Mobile Chrome (Android)

---

## Test Results

```
Test Case | Status | Notes
----------|--------|------
TC-1      | ✅      | Sign up flow working correctly
TC-2      | ✅      | Sign in flow working correctly
TC-3      | ✅      | Sign out flow working correctly
TC-4      | ✅      | Route protection working correctly
TC-5      | ✅      | Auth page redirects working correctly
TC-6      | ✅      | Invalid credentials error handling working
TC-7      | ✅      | Duplicate email error handling working
TC-8      | ✅      | Weak password validation working (browser + server)
TC-9      | ✅      | User profile display working correctly
TC-10     | ✅      | Session persistence working correctly
```

**Status Legend:**

- ✅ Pass
- ❌ Fail
- ⚠️ Partial/Issues
- ⬜ Not Tested

---

## Known Issues / Notes

- ✅ All test cases passed successfully
- ✅ Duplicate email detection working correctly with multiple fallback checks
- ✅ Session handling improved to handle edge cases where signUp doesn't establish session immediately
- ✅ Error messages display correctly inline without redirecting

---

## Next Steps After Testing

1. Fix any critical bugs found
2. Update test plan with results
3. Mark sprint component as complete
4. Move to next sprint component

---

## Rollback Plan

If critical issues are found:

1. Revert auth-related commits
2. Remove auth middleware temporarily
3. Restore direct `/app` access for development
4. Document issues for next iteration
