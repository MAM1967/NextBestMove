# SQL Files to Delete from Root Directory

**Date:** December 9, 2025  
**Purpose:** Clean up one-off debugging queries that are no longer needed

---

## Summary

There are **32 SQL files** in the root directory. Most are one-off debugging queries that should be deleted. Organized templates have been created in `docs/Testing/Test_Queries/`.

**Recommendation:** Delete **31 files** (all one-offs), review **1 file** (`Group2_Phase1_Test_Setup.sql`) before deleting.

---

## Files to Delete (One-Off Debugging Queries)

### Streak Test Files (19 files)

These are all one-off debugging queries for streak testing:

1. `test_streak_day1_setup.sql`
2. `test_streak_day1_verify.sql`
3. `test_streak_day1_fix.sql`
4. `test_streak_day2_setup.sql`
5. `test_streak_day2_verify.sql`
6. `test_streak_day2_verify_quick.sql`
7. `test_streak_day3_setup.sql`
8. `test_streak_day3_verify.sql`
9. `test_streak_day7_setup.sql`
10. `test_streak_day7_verify.sql`
11. `test_streak_day7_verify_quick.sql`
12. `test_streak_day7_no_subscription_setup.sql`
13. `test_streak_day7_no_subscription_verify.sql`
14. `test_streak_day7_deduplication_verify.sql`
15. `test_streak_check_current_state.sql`
16. `test_streak_check_subscription.sql`
17. `test_streak_check_metadata_detail.sql`
18. `test_streak_debug.sql`

### One-Off Fix/Debug Files

19. `create_action_for_peter.sql` - Uses outdated `person_pins` table, one-off test
20. `check_premium_user_status.sql` - Replaced by organized template in `Diagnostics/check_user_status.sql`
21. `check_subscription_plan_type.sql` - One-off check query
22. `fix_premium_plan_direct.sql` - One-off fix query
23. `fix_premium_plan_manual.sql` - One-off fix query
24. `force_reset_warning_flag.sql` - One-off debugging
25. `force_remove_warning_flag.sql` - One-off debugging
26. `check_and_fix_plan_type.sql` - One-off fix query
27. `reset_both_subscriptions.sql` - One-off fix query

### Additional One-Off Files

28. `check_performance_timeline_data.sql` - One-off check query
29. `create_performance_timeline_test_data.sql` - One-off test data creation
30. `fix_plan_name_inconsistency.sql` - One-off fix query
31. `verify_pins_to_leads_migration.sql` - Migration verification (completed, can delete)

### Files to Review Before Deleting

32. `Group2_Phase1_Test_Setup.sql` - May contain useful patterns, review and extract if needed

---

## Files to Keep

These files are in other directories and should be kept:

- `supabase/migrations/*.sql` - Database migrations (keep all)
- `docs/Testing/*.sql` - Test setup files (keep, may need organization)
- `scripts/*.sql` - Utility scripts (review but keep if useful)

---

## Deletion Command

To delete all streak test files:

```bash
cd /Users/michaelmcdermott/NextBestMove
rm test_streak_*.sql
```

To delete one-off fix/debug files:

```bash
cd /Users/michaelmcdermott/NextBestMove
rm create_action_for_peter.sql
rm check_premium_user_status.sql
rm check_subscription_plan_type.sql
rm check_performance_timeline_data.sql
rm create_performance_timeline_test_data.sql
rm fix_premium_plan_*.sql
rm fix_plan_name_inconsistency.sql
rm force_*.sql
rm check_and_fix_plan_type.sql
rm reset_both_subscriptions.sql
rm verify_pins_to_leads_migration.sql
```

**Review before deleting:**
- `Group2_Phase1_Test_Setup.sql` - May have useful test setup patterns

---

## Organized Replacements

All useful queries have been organized into:

- `docs/Testing/Test_Queries/Staging_Setup/` - Test data setup templates
- `docs/Testing/Test_Queries/Billing_Testing/` - Billing test templates
- `docs/Testing/Test_Queries/Diagnostics/` - Diagnostic query templates

---

## Note

Before deleting, ensure:
1. No active references to these files in documentation
2. Useful patterns have been extracted to organized templates
3. You have a backup (git handles this if files are committed)

---

**Status:** Ready for deletion after review

