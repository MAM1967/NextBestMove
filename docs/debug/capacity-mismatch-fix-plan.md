# Capacity Mismatch Fix Plan

## Problem Summary
- **Daily Capacity Card**: Shows "Auto" even when adaptive recovery sets capacity to "micro"
- **Progress Bar**: Correctly shows "Micro capacity" from `dailyPlan.capacity`
- **Root Cause**: Daily Capacity card checks `capacityOverride` (manual override only) instead of `dailyPlan.capacity` (actual capacity used)

## Solution

### 1. Determine Effective Capacity
The "effective capacity" is:
- `capacityOverride` if it exists (manual override)
- Otherwise: `dailyPlan.capacity` (which includes adaptive recovery adjustments)

### 2. Update CapacityOverrideControl
- Pass the effective capacity (not just manual override) to `CapacityOverrideControl`
- This ensures the selected button matches what's actually being used

### 3. Update Auto Capacity Message
- Only show "Auto Capacity is set at X tasks..." when capacity is truly auto
- If `dailyPlan.capacity === "micro"` (from adaptive recovery), show: "Micro capacity (2 tasks) - easing back into your routine"
- If `dailyPlan.capacity === "light"` (from adaptive recovery), show: "Light capacity (3-4 tasks) - easing back into your routine"

### 4. Ensure Consistency
- Both Daily Capacity card and Progress bar should show the same capacity level
- Both should reflect adaptive recovery when it's been applied

## Implementation

### Changes to `plan/page.tsx`:

1. **Calculate effective capacity**:
   ```typescript
   const effectiveCapacity = capacityOverride || dailyPlan?.capacity || null;
   ```

2. **Pass effective capacity to CapacityOverrideControl**:
   ```typescript
   <CapacityOverrideControl
     currentOverride={effectiveCapacity}
     ...
   />
   ```

3. **Update Auto Capacity message logic**:
   - Check if `dailyPlan.capacity` is "micro", "light", etc. (from adaptive recovery)
   - Show appropriate message based on actual capacity
   - Only show "Auto Capacity" when capacity is truly auto (from calendar)

4. **Add adaptive recovery messaging**:
   - When `dailyPlan.capacity === "micro"` and no manual override, show adaptive recovery message
   - Explain why capacity was reduced (e.g., "Welcome back - easing back into your routine")

