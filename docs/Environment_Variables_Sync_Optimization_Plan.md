# Environment Variables Sync Optimization Plan

**Status:** 📋 Planned - P1 Priority  
**Date:** November 29, 2025

## Problem Statement

Currently, the GitHub Actions workflow syncs all environment variables to Vercel on every run, even if they already exist. This is inefficient because:

1. **Unnecessary API calls** - Every variable is checked/updated even if unchanged
2. **Slower execution** - More time spent on redundant operations
3. **Rate limiting risk** - More API calls increase chance of hitting limits
4. **Noisy logs** - Harder to see what actually changed

## Solution: Change Data Capture (CDC) Approach

Only sync environment variables that:
- Don't exist in Vercel yet
- Have changed values (if we can detect this)
- Are missing from Vercel

## Implementation Plan

### Phase 1: Fetch Existing Vercel Variables

**Step 1: List all existing variables in Vercel**

```bash
# Get list of existing environment variables
vercel env ls "$TARGET_ENV" \
  --token="$VERCEL_TOKEN" \
  --scope="$VERCEL_ORG_ID" \
  --json > vercel_existing_vars.json
```

**Step 2: Parse and store in a map**

```bash
# Extract variable names from JSON output
EXISTING_VARS=$(vercel env ls "$TARGET_ENV" \
  --token="$VERCEL_TOKEN" \
  --scope="$VERCEL_ORG_ID" \
  --json | jq -r '.[].key' | sort)
```

### Phase 2: Compare and Sync Only Missing/Changed

**Step 3: Check if variable exists before syncing**

```bash
sync_var() {
  local var_name=$1
  local secret_value=$2
  local env_type=$3
  
  # Check if variable already exists in Vercel
  if echo "$EXISTING_VARS" | grep -q "^${var_name}$"; then
    echo "ℹ️  $var_name already exists in $env_type (skipping)"
    return 0
  fi
  
  # Only sync if it doesn't exist
  if [ -n "$secret_value" ]; then
    echo "📤 Syncing $var_name to $env_type..."
    # ... existing sync logic ...
  fi
}
```

### Phase 3: Optional - Value Comparison (Future Enhancement)

**Step 4: Compare values to detect changes**

```bash
# Get current value from Vercel (if possible)
# Compare with GitHub Secret value
# Only update if different
```

**Note:** Vercel CLI doesn't expose variable values (they're encrypted), so we can't easily compare values. We'd need to:
- Store a hash of values in GitHub Actions cache
- Compare hashes on subsequent runs
- Or use Vercel API directly (more complex)

## Implementation Details

### Modified Workflow Structure

```yaml
- name: Sync GitHub Secrets to Vercel
  run: |
    # ... setup code ...
    
    # Step 1: Fetch existing variables from Vercel
    echo "📋 Fetching existing Vercel environment variables..."
    EXISTING_VARS=$(vercel env ls "$TARGET_ENV" \
      --token="$VERCEL_TOKEN" \
      --scope="$VERCEL_ORG_ID" \
      --json 2>/dev/null | jq -r '.[].key' | sort || echo "")
    
    if [ -z "$EXISTING_VARS" ]; then
      echo "⚠️  Could not fetch existing variables, will sync all"
      EXISTING_VARS=""
    else
      echo "✅ Found $(echo "$EXISTING_VARS" | wc -l) existing variables"
    fi
    
    # Step 2: Modified sync_var function
    sync_var() {
      local var_name=$1
      local secret_value=$2
      local env_type=$3
      
      # Skip if variable already exists
      if [ -n "$EXISTING_VARS" ] && echo "$EXISTING_VARS" | grep -q "^${var_name}$"; then
        echo "⏭️  Skipping $var_name (already exists in $env_type)"
        return 0
      fi
      
      # Only sync if it doesn't exist
      if [ -n "$secret_value" ]; then
        echo "📤 Syncing $var_name to $env_type..."
        # ... rest of sync logic ...
      fi
    }
    
    # Step 3: Sync variables (only missing ones)
    sync_var "SUPABASE_SERVICE_ROLE_KEY" "${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" "$TARGET_ENV"
    # ... rest of variables ...
```

### Dependencies

- **`jq`** - JSON parsing (usually available in GitHub Actions ubuntu-latest)
- **Vercel CLI** - Already installed in workflow

### Error Handling

1. **If `vercel env ls` fails:**
   - Fall back to current behavior (sync all)
   - Log warning but continue

2. **If `jq` is not available:**
   - Use `grep`/`awk` for simple parsing
   - Or fall back to current behavior

3. **If variable list is empty:**
   - Assume no variables exist
   - Sync all (safe default)

## Benefits

1. ✅ **Faster execution** - Skip existing variables
2. ✅ **Fewer API calls** - Only sync what's needed
3. ✅ **Clearer logs** - See only what's actually synced
4. ✅ **Reduced rate limiting risk** - Less API usage
5. ✅ **Idempotent** - Safe to run multiple times

## Limitations

1. **Value changes not detected** - Can't compare encrypted values
   - Solution: Use `--force` flag when we need to update (manual trigger)
   - Or: Store value hashes in GitHub Actions cache (future enhancement)

2. **First run still syncs all** - Expected behavior for initial setup

3. **Manual updates in Vercel** - Won't be detected (by design)

## Testing Plan

1. **Test with empty Vercel project** - Should sync all variables
2. **Test with existing variables** - Should skip existing, sync new ones
3. **Test error handling** - Should fall back gracefully if `vercel env ls` fails
4. **Test with mixed state** - Some exist, some don't

## Future Enhancements

1. **Value change detection** - Store hashes in GitHub Actions cache
2. **Update existing variables** - Use `--force` flag when values change
3. **Dry-run mode** - Show what would be synced without actually syncing
4. **Sync report** - Summary of what was synced vs skipped

## Migration Strategy

1. **Backward compatible** - If CDC fails, fall back to current behavior
2. **Gradual rollout** - Test on preview environment first
3. **Monitor execution time** - Should see improvement in workflow duration

---

_Last updated: November 29, 2025_

