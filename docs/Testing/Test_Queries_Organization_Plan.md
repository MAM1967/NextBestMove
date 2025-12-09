# Test Queries Organization Plan

**Status:** 🚧 In Progress  
**Last Updated:** December 9, 2025

---

## Overview

This document outlines the plan to organize and clean up test queries scattered throughout the repository. Many one-off debugging queries need to be removed, while reusable test setup queries should be properly filed for future use.

---

## Current State

### Root Directory SQL Files (To Review)

These appear to be one-off debugging queries that should likely be removed:

- `test_streak_*.sql` - Multiple streak-related test/debug queries (one-off)
- `create_action_for_peter.sql` - One-off debugging query
- `check_premium_user_status.sql` - One-off check query
- `check_subscription_plan_type.sql` - One-off check query
- `fix_premium_plan_*.sql` - One-off fix queries
- `force_reset_warning_flag.sql` - One-off debugging query
- `check_and_fix_plan_type.sql` - One-off fix query
- `reset_both_subscriptions.sql` - One-off fix query
- `Group2_Phase1_Test_Setup.sql` - May be useful, review

### Scripts Directory (Review)

- `scripts/create-staging-users.sql` - ✅ Keep (useful for staging setup)
- `scripts/import-users-to-staging.sql` - ✅ Keep (useful for staging)
- `scripts/export-users-from-prod.sql` - ⚠️ Review (may contain sensitive queries)
- `scripts/export-users-from-prod-safe.sql` - ✅ Keep (safer version)
- `scripts/skip-test-data-migrations.sql` - ✅ Keep (utility script)
- `scripts/skip-debug-migrations.sql` - ✅ Keep (utility script)
- `scripts/fix-migration-conflict.sql` - ⚠️ Review (one-off fix)

### Docs/Testing Directory (Organize)

- `docs/Testing/Group1_Test_Data_Setup.sql` - ✅ Keep (useful test setup)
- `docs/Testing/Group1_Quick_Start.sql` - ✅ Keep (test setup)
- `docs/Testing/Group1_*.sql` - Review debug/fix queries
- Other SQL files in Testing directory - Review and organize

---

## Organization Structure

### Proposed Directory Structure

```
docs/Testing/
├── Test_Queries/
│   ├── Staging_Setup/
│   │   ├── create_test_users.sql
│   │   ├── create_test_leads.sql
│   │   ├── create_test_actions.sql
│   │   └── complete_test_account_setup.sql
│   ├── Billing_Testing/
│   │   ├── create_trial_users.sql
│   │   ├── create_premium_user.sql
│   │   └── test_subscription_states.sql
│   └── README.md (explains when/how to use each query)
```

---

## Action Plan

### Phase 1: Review and Categorize (Current)

- [x] Identify all SQL files in repository
- [ ] Review each file and categorize:
  - **Keep (Reusable)** - Move to organized location
  - **Archive** - Move to archive/old directory
  - **Delete** - One-off debugging queries with no future value

### Phase 2: Organize Useful Queries

- [ ] Create `docs/Testing/Test_Queries/` directory structure
- [ ] Move reusable test setup queries
- [ ] Update queries to use correct table names (leads not person_pins)
- [ ] Add documentation/comments to each query
- [ ] Create README explaining purpose and usage

### Phase 3: Clean Up

- [ ] Delete one-off debugging queries from root directory
- [ ] Archive old test queries that may have historical value
- [ ] Update any documentation that references moved queries

---

## Decision Criteria

### Keep Query If:
- ✅ Creates reusable test data (users, leads, actions)
- ✅ Useful for staging environment setup
- ✅ Demonstrates proper usage patterns
- ✅ Part of documented test procedures

### Delete Query If:
- ❌ One-off debugging query
- ❌ Temporary fix that's no longer needed
- ❌ Contains hardcoded user IDs/emails that are outdated
- ❌ Has no documentation or clear purpose

### Archive Query If:
- ⚠️ Historical value but not actively used
- ⚠️ May be referenced in old documentation
- ⚠️ Demonstrates evolution of schema/queries

---

## Files to Review

### High Priority (Root Directory)

1. `test_streak_*.sql` (20+ files) - Review for useful patterns, delete one-offs
2. `create_action_for_peter.sql` - Likely delete (one-off)
3. `check_*.sql` files - Review, likely delete if one-off
4. `fix_*.sql` files - Review, likely delete if one-off
5. `Group2_Phase1_Test_Setup.sql` - Review for reusability

### Medium Priority (Scripts Directory)

1. `scripts/create-staging-users.sql` - ✅ Keep
2. `scripts/import-users-to-staging.sql` - ✅ Keep
3. `scripts/export-users-from-prod.sql` - Review security implications
4. `scripts/fix-migration-conflict.sql` - Review if still needed

### Low Priority (Docs/Testing)

1. Test setup SQL files - Organize into Test_Queries/
2. Debug SQL files - Review and remove one-offs

---

## Next Steps

1. Start reviewing root directory SQL files
2. Create Test_Queries directory structure
3. Move useful queries and document them
4. Delete unnecessary one-off queries
5. Update documentation

---

**Status:** Ready to begin review and organization

