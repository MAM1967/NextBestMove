# Capacity Mismatch Fix - Summary

## Problem
- **Daily Capacity Card**: Showed "Auto" even when adaptive recovery set capacity to "micro"
- **Progress Bar**: Correctly showed "Micro capacity" from `dailyPlan.capacity`
- **Root Cause**: Daily Capacity card checked `capacityOverride` (manual override only) instead of `dailyPlan.capacity` (actual capacity used, including adaptive recovery)

## Solution Implemented

### 1. Calculate Effective Capacity
- Effective capacity = `capacityOverride` (manual) OR `dailyPlan.capacity` (actual used, includes adaptive recovery)
- This ensures the selected button in `CapacityOverrideControl` matches what's actually being used

### 2. Distinguish Between Capacity Sources
- **Manual Override**: `capacityOverride` exists → Show override message
- **Adaptive Recovery**: `dailyPlan.capacity === "micro"` or `"light"`, no manual override, and not user's default → Show adaptive recovery message
- **Auto (Calendar/Default)**: Otherwise → Show "Auto Capacity" message

### 3. Updated Messages
- **Manual Override**: "Busy Day / Light Day / Standard / Heavy Day capacity is set at X tasks"
- **Adaptive Recovery**: "Micro / Light capacity (X tasks) - easing back into your routine" (blue background)
- **Auto**: "Auto Capacity is set at X tasks based on Y minutes of availability today"

## Changes Made

### `web/src/app/app/plan/page.tsx`:

1. **Added state for user default capacity**:
   ```typescript
   const [defaultCapacityOverride, setDefaultCapacityOverride] = useState<CapacityLevel | null>(null);
   ```

2. **Updated `fetchCapacityOverride`** to also fetch `defaultOverride` from API

3. **Updated Daily Capacity Card**:
   - Calculate `effectiveCapacity` = `capacityOverride || (dailyPlan.capacity !== "default" ? dailyPlan.capacity : null)`
   - Pass `effectiveCapacity` to `CapacityOverrideControl` instead of just `capacityOverride`
   - Show different messages based on capacity source:
     - Manual override → Override message
     - Adaptive recovery → Blue message with "easing back into your routine"
     - Auto → "Auto Capacity" message

4. **Logic to detect adaptive recovery**:
   ```typescript
   const isAdaptiveRecovery = 
     (dailyPlan.capacity === "micro" || dailyPlan.capacity === "light") &&
     !capacityOverride &&
     defaultCapacityOverride !== dailyPlan.capacity;
   ```

## Result

Now both the Daily Capacity card and Progress bar show the same capacity level:
- If adaptive recovery sets capacity to "micro", both show "Micro capacity"
- If user manually overrides to "light", both show "Light capacity"
- If capacity is truly auto, both show "Auto" / "Calendar-based capacity"

## Testing

To verify the fix:
1. Create a user who hasn't logged in for 7+ days
2. Generate a daily plan
3. Check that:
   - Daily Capacity card shows "Micro capacity" (not "Auto")
   - Progress bar shows "Micro capacity"
   - Both match
   - The message explains "easing back into your routine"

