# Phase 1.2: Supabase Staging Project - Checklist

**Status:** 📋 In Progress  
**Total Migrations:** 41

---

## ✅ Setup Tasks

- [ ] **Step 1: Create Staging Project**
  - [ ] Go to https://supabase.com/dashboard
  - [ ] Create new project: `nextbestmove-staging`
  - [ ] Choose same region as production
  - [ ] Save database password securely
  - [ ] Note project reference ID

- [ ] **Step 2: Get Credentials**
  - [ ] Copy Project URL: `https://[project-ref].supabase.co`
  - [ ] Copy Anon/Public Key
  - [ ] Copy Service Role Key (keep secret!)
  - [ ] Store credentials securely

- [ ] **Step 3: Apply Migrations**
  - [ ] Option A: Use Supabase CLI
    - [ ] Run: `supabase link --project-ref <staging-project-ref>`
    - [ ] Run: `supabase db push`
    - [ ] Or use helper script: `./scripts/setup-staging-supabase.sh`
  - [ ] Option B: Manual via SQL Editor
    - [ ] Apply `202511260001_initial_schema.sql` first
    - [ ] Apply all other migrations in chronological order
    - [ ] Verify all 41 migrations applied

- [ ] **Step 4: Configure Auth Settings**
  - [ ] Go to Authentication → Settings
  - [ ] Disable email confirmations (or use test domains)
  - [ ] Set Site URL: `https://staging.nextbestmove.app`
  - [ ] Add redirect URL: `https://staging.nextbestmove.app/auth/callback`
  - [ ] Configure OAuth providers (if needed)
  - [ ] Disable invite users functionality

- [ ] **Step 5: Create Test Users**
  - [ ] Create test user: `test+premium@example.com` (via sign-up)
  - [ ] Create test user: `test+standard@example.com` (via sign-up)
  - [ ] Create test user: `test+trial@example.com` (via sign-up)
  - [ ] Create test user: `test+canceled@example.com` (via sign-up)
  - [ ] Verify users created in `users` table

- [ ] **Step 6: Verify RLS Policies**
  - [ ] Test with multiple users
  - [ ] Verify data isolation (users can't see each other's data)
  - [ ] Test with service role key (should bypass RLS)

- [ ] **Step 7: Document Credentials**
  - [ ] Project Name: `nextbestmove-staging`
  - [ ] Project Ref: `[your-project-ref]`
  - [ ] Project URL: `https://[project-ref].supabase.co`
  - [ ] Anon Key: `[saved securely]`
  - [ ] Service Role Key: `[saved securely - KEEP SECRET]`

---

## 📋 Migration List (41 total)

Apply in this order:

1. `202511260001_initial_schema.sql` ⭐ **START HERE**
2. `202501270001_create_tasks_table.sql`
3. `202501270002_add_users_insert_policy.sql`
4. `202501270003_insert_test_actions.sql`
5. `202501270004_add_daily_plans_rls_policies.sql`
6. `202501270005_add_weekly_summaries_rls_policies.sql`
7. `202501270006_insert_stale_test_actions.sql`
8. `202501270007_debug_stale_actions.sql`
9. `202501270008_verify_stale_actions.sql`
10. `202501270009_debug_stale_actions_query.sql`
11. `202501270010_find_stale_test_actions.sql`
12. `202501270011_insert_stale_actions_direct.sql`
13. `202501270012_add_billing_insert_policy.sql`
14. `202501270012_check_old_actions.sql`
15. `202501270013_add_billing_subscriptions_insert_update_policy.sql`
16. `202501270013_update_existing_stale_actions.sql`
17. `202501270014_add_weekend_preference.sql`
18. `202501280000_add_byok_fields.sql`
19. `202501280001_create_test_premium_user.sql`
20. `202501280002_create_premium_for_user.sql`
21. `202501280003_fix_existing_subscription.sql`
22. `202501280004_verify_byok_setup.sql`
23. `202501280005_check_byok_columns.sql`
24. `202501280006_add_email_preferences.sql`
25. `202501280007_add_users_delete_policy.sql`
26. `202501280008_check_tables.sql`
27. `202501290000_add_working_hours.sql`
28. `202501290001_update_working_hours_to_time.sql`
29. `202501290002_add_time_format_preference.sql`
30. `202501290003_add_onboarding_completed.sql`
31. `202501300000_add_payment_failed_at.sql`
32. `202501300001_create_cancellation_feedback_table.sql`
33. `202501300002_add_users_metadata.sql`
34. `202501310001_create_test_data_for_standard_user.sql`
35. `202512040003_add_user_patterns.sql`
36. `202512040004_add_pattern_detection_functions.sql`
37. `202512040005_add_pre_call_briefs.sql`
38. `20251204163305_rename_pins_to_leads.sql` ⚠️ **Important: Renames pins to leads**
39. `202512050001_create_performance_timeline_data.sql`
40. `202512050002_create_user_voice_profile.sql`
41. `202512050003_add_manual_voice_samples.sql` ⭐ **END HERE**

---

## 🧪 Verification Tests

- [ ] **Database Connection:**
  ```bash
  supabase db remote list
  ```

- [ ] **Auth Test:**
  - [ ] Sign up a test user
  - [ ] Verify user record in `users` table
  - [ ] Sign in works

- [ ] **RLS Test:**
  - [ ] Create two test users
  - [ ] User A can only see their own data
  - [ ] User B can only see their own data
  - [ ] No cross-user data access

- [ ] **Migration Verification:**
  - [ ] Check Supabase Dashboard → Database → Migrations
  - [ ] All 41 migrations should be listed
  - [ ] No failed migrations

---

## 📝 Notes

- **Migration Order:** Always apply migrations in chronological order (by filename)
- **Test Data:** Some migrations include test data - that's fine for staging
- **RLS:** Row Level Security is critical - verify it's working before proceeding
- **Credentials:** Never commit service role keys to git

---

## ✅ Completion Criteria

- [ ] Staging Supabase project created
- [ ] All 41 migrations applied successfully
- [ ] Auth settings configured
- [ ] Test users created
- [ ] RLS policies verified
- [ ] Credentials documented securely
- [ ] Ready for Phase 1.3 (Vercel Configuration)

---

**Last Updated:** January 2025

