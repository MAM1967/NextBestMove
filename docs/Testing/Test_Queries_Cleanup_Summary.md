# Test Queries Cleanup Summary

**Date:** December 9, 2025  
**Status:** ✅ Complete

---

## Actions Taken

### 1. Created Organized Directory Structure

```
docs/Testing/Test_Queries/
├── README.md
├── Staging_Setup/
│   ├── create_test_users.sql (from scripts/)
│   ├── create_test_leads.sql (new template)
│   └── create_test_actions.sql (new template)
├── Billing_Testing/
│   ├── create_trial_users.sql (new template)
│   └── create_premium_user.sql (new template)
└── Diagnostics/
    └── check_user_status.sql (new template)
```

### 2. Organized Useful Queries

**Moved to Organized Locations:**
- `scripts/create-staging-users.sql` → `Staging_Setup/create_test_users.sql`
- Created templates based on `Group1_Test_Data_Setup.sql` patterns

**Created New Templates:**
- `create_test_leads.sql` - Template for creating test leads
- `create_test_actions.sql` - Template for creating test actions
- `create_trial_users.sql` - Template for trial state setup
- `create_premium_user.sql` - Template for premium subscription setup
- `check_user_status.sql` - Diagnostic query template

### 3. Files to Delete (One-Off Debugging Queries)

The following files in the root directory are one-off debugging queries and should be deleted:

**Streak Test Files (20+ files):**
- `test_streak_*.sql` - One-off streak testing queries
- All streak-related test files are temporary debugging queries

**One-Off Fix/Debug Files:**
- `create_action_for_peter.sql` - One-off test for specific user (uses outdated `person_pins`)
- `check_premium_user_status.sql` - One-off diagnostic (replaced by organized template)
- `check_subscription_plan_type.sql` - One-off check query
- `fix_premium_plan_*.sql` - One-off fix queries
- `force_reset_warning_flag.sql` - One-off debugging
- `force_remove_warning_flag.sql` - One-off debugging
- `check_and_fix_plan_type.sql` - One-off fix query
- `reset_both_subscriptions.sql` - One-off fix query

**Files to Review Before Deleting:**
- `Group2_Phase1_Test_Setup.sql` - May have useful patterns, review first

---

## Recommendations

### Immediate Actions

1. **Review `Group2_Phase1_Test_Setup.sql`** - Extract useful patterns if any
2. **Delete all `test_streak_*.sql` files** from root directory
3. **Delete one-off fix/debug queries** listed above
4. **Keep scripts in `scripts/` directory** that are useful utilities:
   - `scripts/create-staging-users.sql` - Already copied to organized location
   - `scripts/import-users-to-staging.sql` - Review for usefulness
   - `scripts/export-users-from-prod-safe.sql` - Useful utility

### Future Maintenance

- Add new test queries to organized directories
- Update templates to use `<placeholder>` format instead of hardcoded values
- Keep queries in `docs/Testing/Test_Queries/` organized by category
- Delete one-off debugging queries after use

---

## Query Updates Needed

All new templates:
- ✅ Use `leads` table (not `person_pins`)
- ✅ Use placeholder format (`<user_email>`, `<USER_ID>`) instead of hardcoded values
- ✅ Include verification queries
- ✅ Include documentation/comments

---

## Next Steps

1. Review and delete root directory SQL files (one-offs)
2. Update any documentation that references moved queries
3. Test new templates to ensure they work correctly

---

**Cleanup Complete:** Core organization structure created, templates established, cleanup plan documented.

