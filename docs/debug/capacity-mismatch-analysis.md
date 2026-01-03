# Capacity Mismatch Analysis

## Problem
Daily Capacity card shows "Auto" but Progress bar shows "Micro capacity" - they don't match.

## Root Cause

### How Capacity Works

1. **Plan Generation Flow** (`generate-daily-plan.ts`):
   - Line 222: Gets initial capacity from `getCapacityWithOverrides()` (checks manual override > user default > calendar)
   - Lines 231-267: **Adaptive Recovery Logic** - OVERRIDES capacity if user hasn't logged in:
     - 7+ days inactive → `capacityLevel = "micro"`, `actionCount = 2`
     - 2-6 days inactive → `capacityLevel = "micro"`, `actionCount = 2`
     - Low completion → `capacityLevel = "light"`, `actionCount = 3`
   - Line 635: Saves plan with `capacity: capacityLevel` (could be "micro" due to adaptive logic)

2. **Daily Capacity Card Display** (`plan/page.tsx` line 628):
   - Checks: `!capacityOverride && dailyPlan.capacity`
   - `capacityOverride` comes from `/api/plan/capacity-override` which only returns `daily_plans.capacity_override` (manual override)
   - **Problem**: It doesn't check if `dailyPlan.capacity` was set to "micro" by adaptive recovery
   - Shows "Auto Capacity" even when adaptive recovery set it to "micro"

3. **Progress Bar Display** (`plan/page.tsx` line 773):
   - Checks: `dailyPlan.capacity && dailyPlan.capacity !== "default"`
   - Shows capacity badge from `dailyPlan.capacity` (correctly shows "Micro capacity")

### The Mismatch

- **Daily Capacity Card**: Checks `capacityOverride` (manual override only) → Shows "Auto"
- **Progress Bar**: Checks `dailyPlan.capacity` (actual capacity used) → Shows "Micro capacity"
- **Result**: They show different things!

## Solution

The Daily Capacity card should check `dailyPlan.capacity` (the actual capacity being used) instead of just `capacityOverride` (manual override).

### Fix Plan

1. **Update Daily Capacity Card Logic**:
   - Check `dailyPlan.capacity` to determine what to display
   - If `dailyPlan.capacity === "micro"` → Show "Micro" (not "Auto")
   - If `dailyPlan.capacity === "light"` → Show "Light" (not "Auto")
   - If `dailyPlan.capacity === "default"` or null → Show "Auto"
   - Only show "Auto" when capacity is truly auto (from calendar or default)

2. **Update CapacityOverrideControl**:
   - When displaying current selection, check `dailyPlan.capacity` if no manual override exists
   - This ensures the selected button matches what's actually being used

3. **Update Auto Capacity Message**:
   - Only show "Auto Capacity is set at X tasks..." when capacity is truly auto
   - If adaptive recovery was applied, show a message like "Micro capacity (2 tasks) - easing back into your routine"

## Implementation Steps

1. Modify `plan/page.tsx` to check `dailyPlan.capacity` instead of just `capacityOverride`
2. Update the logic that determines which capacity button should be selected
3. Update the "Auto Capacity" message to only show when capacity is truly auto
4. Add a message explaining when adaptive recovery has been applied

