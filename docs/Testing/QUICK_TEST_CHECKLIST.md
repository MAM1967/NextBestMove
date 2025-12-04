# Quick Testing Checklist - Sprint 1: Auth

## Before You Start

1. **Apply the new migration:**
   ```sql
   -- Run in Supabase SQL Editor
   -- File: supabase/migrations/202501270002_add_users_insert_policy.sql
   ```

2. **Restart dev server:**
   ```bash
   cd web
   npm run dev
   ```

## Quick Smoke Tests (5 minutes)

- [ ] Visit `/` → Click "Get started" → Should go to sign-up page
- [ ] Create a new account → Should redirect to dashboard
- [ ] Check sidebar → Should show your name/email
- [ ] Click "Sign out" → Should go to sign-in page
- [ ] Try to visit `/app` while signed out → Should redirect to sign-in
- [ ] Sign in → Should go to dashboard
- [ ] Try to visit `/auth/sign-in` while signed in → Should redirect to dashboard

## If Everything Works ✅

- Mark Sprint 1 as complete
- Proceed to next sprint component

## If Issues Found ❌

- Document in test plan
- Check browser console for errors
- Check Supabase logs
- Verify migrations are applied







