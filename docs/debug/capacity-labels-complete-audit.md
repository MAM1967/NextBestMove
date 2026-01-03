# Complete Capacity Labels Audit

## All Places Where Capacity Labels Are Displayed

### 1. Daily Plan Page - Capacity Selector (`CapacityOverrideControl.tsx`)
**Current Labels:**
- "Auto" - "Use calendar-based capacity"
- "Busy Day" - "1-2 actions" (value: "micro")
- "Light Day" - "3-4 actions" (value: "light")
- "Standard" - "5-6 actions" (value: "standard")
- "Heavy Day" - "7-8 actions" (value: "heavy")

### 2. Daily Plan Page - Capacity Details Message (`plan/page.tsx` lines 647-650)
**Current Labels:**
- "Busy Day" (value: "micro")
- "Light Day" (value: "light")
- "Standard" (value: "standard")
- "Heavy Day" (value: "heavy")

### 3. Daily Plan Page - Progress Bar (`plan/page.tsx` lines 854-857)
**Current Labels:**
- "Micro capacity" (value: "micro") ❌ INCONSISTENT
- "Light capacity" (value: "light") ❌ INCONSISTENT
- "Calendar-based capacity" (value: "standard") ❌ INCONSISTENT
- "Heavy capacity" (value: "heavy") ❌ INCONSISTENT

### 4. Daily Plan Page - Adaptive Recovery Message (`plan/page.tsx` lines 675-680)
**Current Labels:**
- "Micro capacity" (value: "micro") ❌ INCONSISTENT
- "Light capacity" (value: "light") ❌ INCONSISTENT

### 5. Settings Page - Default Capacity (`DefaultCapacitySection.tsx`)
**Current Labels:**
- "Auto (from calendar)" - "Use calendar to determine capacity" (value: null) ❌ INCONSISTENT
- "Micro" - "1-2 actions per day" (value: "micro") ❌ INCONSISTENT
- "Light" - "3-4 actions per day" (value: "light") ❌ INCONSISTENT
- "Standard" - "5-6 actions per day" (value: "standard") ❌ INCONSISTENT
- "Heavy" - "7-8 actions per day" (value: "heavy") ❌ INCONSISTENT

### 6. Calendar Events View (`CalendarEventsView.tsx` lines 94-100)
**Current Labels:**
- "Micro" (value: "micro") ❌ INCONSISTENT
- "Light" (value: "light") ❌ INCONSISTENT
- "Standard" (value: "standard") ✅ CORRECT
- "Heavy" (value: "heavy") ❌ INCONSISTENT
- "Default" (value: "default")

## Standardized Labels (Source of Truth)

All locations should use:
- **"Auto"** - "Use calendar-based capacity" (value: null)
- **"Busy Day"** - "1-2 actions" (value: "micro")
- **"Light Day"** - "3-4 actions" (value: "light")
- **"Standard"** - "5-6 actions" (value: "standard")
- **"Heavy Day"** - "7-8 actions" (value: "heavy")

## Files That Need Updates

1. **NEW**: `web/src/lib/plan/capacity-labels.ts` - Shared labels constant
2. **UPDATE**: `web/src/app/app/components/CapacityOverrideControl.tsx` - Already correct, but use shared constant
3. **UPDATE**: `web/src/app/app/settings/DefaultCapacitySection.tsx` - Update all labels
4. **UPDATE**: `web/src/app/app/settings/CalendarEventsView.tsx` - Update labels
5. **UPDATE**: `web/src/app/app/plan/page.tsx` - Update:
   - Progress bar (lines 854-857)
   - Adaptive recovery message (lines 675-680)
   - Capacity details message (lines 647-650) - Already correct, but use shared constant

## Implementation Checklist

- [ ] Create shared `capacity-labels.ts` with all 5 capacity levels
- [ ] Update `CapacityOverrideControl.tsx` to use shared constant
- [ ] Update `DefaultCapacitySection.tsx` to use shared constant
- [ ] Update `CalendarEventsView.tsx` to use shared constant
- [ ] Update Progress bar in `plan/page.tsx` to use shared constant
- [ ] Update Adaptive recovery message in `plan/page.tsx` to use shared constant
- [ ] Update Capacity details message in `plan/page.tsx` to use shared constant
- [ ] Verify "Standard" appears consistently everywhere
- [ ] Verify all descriptions are consistent ("1-2 actions" not "1-2 actions per day")

