# RLS Security Fix - December 2025

**Date:** December 10, 2025  
**Status:** ✅ Migration Created  
**Severity:** ERROR (Security)

---

## Issue

Supabase Advisor detected 4 tables with RLS (Row Level Security) disabled in the public schema:

1. `calendar_sync_logs` - Calendar sync audit log
2. `billing_events` - Stripe webhook audit log
3. `user_patterns` - User behavior patterns
4. `pre_call_briefs` - Pre-call briefs

**Risk:** Tables without RLS can be accessed by anyone with API access, potentially exposing sensitive data.

---

## Solution

Created migration `202512100001_enable_rls_missing_tables.sql` to:

1. **Enable RLS** on all 4 tables
2. **Add appropriate policies** based on table usage:
   - Audit logs: Service role only
   - User data: Users can view their own
   - System data: Service role only

---

## RLS Policies Applied

### 1. calendar_sync_logs

**Access Pattern:**
- Service role: Full access (for logging/debugging)
- Users: Can view logs for their own calendar connections

**Policies:**
- `Service role full access` - Service role can do everything
- `Users can view own calendar sync logs` - Users can SELECT logs for their calendar connections

### 2. billing_events

**Access Pattern:**
- Service role: Full access (for webhook processing)
- Users: No access (audit log only)

**Policies:**
- `Service role full access` - Service role can do everything

### 3. user_patterns

**Access Pattern:**
- Users: Can view their own patterns
- Service role: Can manage patterns (for cron jobs)

**Policies:**
- `Users can view own patterns` - Users can SELECT their own patterns
- `Service role can manage user_patterns` - Service role can INSERT/UPDATE/DELETE

### 4. pre_call_briefs

**Access Pattern:**
- Users: Can view their own briefs
- Service role: Can manage briefs (for cron jobs)

**Policies:**
- `Users can view own pre_call_briefs` - Users can SELECT their own briefs
- `Service role can manage pre_call_briefs` - Service role can INSERT/UPDATE/DELETE

---

## Migration Details

**File:** `supabase/migrations/202512100001_enable_rls_missing_tables.sql`

**Changes:**
- Enables RLS on all 4 tables
- Creates 7 RLS policies total
- Uses `auth.role() = 'service_role'` for service role checks
- Uses `auth.uid() = user_id` for user data checks
- Uses EXISTS subquery for `calendar_sync_logs` (via calendar_connections)

---

## Deployment

### Staging
1. Apply migration to `nextbestmove-staging` project
2. Verify RLS policies work correctly
3. Test user access patterns

### Production
1. Apply migration to `nextbestmove` project
2. Verify no access issues
3. Confirm Supabase Advisor warnings resolved

---

## Verification

After migration:
1. Check Supabase Advisor - warnings should be resolved
2. Verify users can still access their own data
3. Verify cron jobs still work (service role access)
4. Test API access patterns

---

## Impact Assessment

**Low Risk:**
- Migration only adds security (doesn't remove access)
- Policies match current usage patterns
- Service role access preserved for cron jobs
- User access preserved for user data

**No Breaking Changes Expected:**
- All current access patterns should continue working
- Policies are additive (more restrictive, not less)

---

**Status:** Migration ready for deployment

