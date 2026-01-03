# Capacity Labels Alignment Plan

## Problem

Capacity settings use different labels in different places:

- **Daily Plan Page**: "Busy Day", "Light Day", "Standard", "Heavy Day"
- **Settings Page**: "Micro", "Light", "Standard", "Heavy"
- **Calendar Events View**: "Micro", "Light", "Standard", "Heavy"

This creates confusion and inconsistency.

## Current State

### Daily Plan Page (`CapacityOverrideControl.tsx`):

- "Auto" - "Use calendar-based capacity"
- "Busy Day" - "1-2 actions" (value: "micro")
- "Light Day" - "3-4 actions" (value: "light")
- "Standard" - "5-6 actions" (value: "standard")
- "Heavy Day" - "7-8 actions" (value: "heavy")

### Settings Page (`DefaultCapacitySection.tsx`):

- "Auto (from calendar)" - "Use calendar to determine capacity" (value: null)
- "Micro" - "1-2 actions per day" (value: "micro")
- "Light" - "3-4 actions per day" (value: "light")
- "Standard" - "5-6 actions per day" (value: "standard")
- "Heavy" - "7-8 actions per day" (value: "heavy")

### Calendar Events View (`CalendarEventsView.tsx`):

- Uses "Micro", "Light", "Standard", "Heavy" labels

### Progress Bar on Daily Plan Page (`plan/page.tsx` lines 854-857):

- "Micro capacity" (value: "micro")
- "Light capacity" (value: "light")
- "Heavy capacity" (value: "heavy")
- "Calendar-based capacity" (value: "standard")

## Solution

### 1. Create Shared Capacity Labels Utility

Create a shared constant file that defines capacity labels and descriptions in one place:

- File: `web/src/lib/plan/capacity-labels.ts`
- Export: `capacityLabels` constant with all labels and descriptions

### 2. Standardize Labels (Use Daily Plan as Source of Truth)

All pages will use:

- **"Auto"** (not "Auto (from calendar)") - "Use calendar-based capacity"
- **"Busy Day"** (not "Micro") - "1-2 actions"
- **"Light Day"** (not "Light") - "3-4 actions"
- **"Standard"** - "5-6 actions"
- **"Heavy Day"** (not "Heavy") - "7-8 actions"

### 3. Update All Components

1. **Create** `web/src/lib/plan/capacity-labels.ts` with shared labels
2. **Update** `CapacityOverrideControl.tsx` to use shared labels
3. **Update** `DefaultCapacitySection.tsx` to use shared labels
4. **Update** `CalendarEventsView.tsx` to use shared labels

### 4. Benefits

- Single source of truth for capacity labels
- Consistent user experience across all pages
- Easier to maintain and update in the future
- No more confusion between "Micro" and "Busy Day"

## Implementation Steps

1. Create `web/src/lib/plan/capacity-labels.ts` with:

   ```typescript
   export const capacityLabels = {
     auto: { label: "Auto", description: "Use calendar-based capacity" },
     micro: { label: "Busy Day", description: "1-2 actions" },
     light: { label: "Light Day", description: "3-4 actions" },
     standard: { label: "Standard", description: "5-6 actions" },
     heavy: { label: "Heavy Day", description: "7-8 actions" },
   };

   // Helper function to get label for a capacity level
   export function getCapacityLabel(capacity: string | null): string {
     if (!capacity || capacity === "default") {
       return capacityLabels.auto.label;
     }
     return (
       capacityLabels[capacity as keyof typeof capacityLabels]?.label ||
       capacityLabels.auto.label
     );
   }

   // Helper function to get description for a capacity level
   export function getCapacityDescription(capacity: string | null): string {
     if (!capacity || capacity === "default") {
       return capacityLabels.auto.description;
     }
     return (
       capacityLabels[capacity as keyof typeof capacityLabels]?.description ||
       capacityLabels.auto.description
     );
   }
   ```

2. Update `CapacityOverrideControl.tsx` to import and use `capacityLabels`

3. Update `DefaultCapacitySection.tsx` to import and use `capacityLabels`

4. Update `CalendarEventsView.tsx` to import and use `capacityLabels`

5. Update Progress bar in `plan/page.tsx` (lines 854-857) to use shared labels

   - Replace "Micro capacity" → "Busy Day"
   - Replace "Light capacity" → "Light Day"
   - Replace "Calendar-based capacity" → "Standard"
   - Replace "Heavy capacity" → "Heavy Day"

6. Update Adaptive recovery message in `plan/page.tsx` (lines 675-680) to use shared labels

   - Replace "Micro capacity" → "Busy Day"
   - Replace "Light capacity" → "Light Day"

7. Update Capacity details message in `plan/page.tsx` (lines 647-650) to use shared constant

   - Already has correct labels, but should use shared constant for consistency

8. Test that all locations show the same labels:
   - ✅ "Auto" everywhere (not "Auto (from calendar)")
   - ✅ "Busy Day" everywhere (not "Micro" or "Micro capacity")
   - ✅ "Light Day" everywhere (not "Light" or "Light capacity")
   - ✅ "Standard" everywhere (consistent)
   - ✅ "Heavy Day" everywhere (not "Heavy" or "Heavy capacity")
   - ✅ All descriptions use "X-Y actions" (not "X-Y actions per day")

## Files to Modify

1. **NEW**: `web/src/lib/plan/capacity-labels.ts`
2. **UPDATE**: `web/src/app/app/components/CapacityOverrideControl.tsx`
3. **UPDATE**: `web/src/app/app/settings/DefaultCapacitySection.tsx`
4. **UPDATE**: `web/src/app/app/settings/CalendarEventsView.tsx`
5. **UPDATE**: `web/src/app/app/plan/page.tsx` (Multiple sections):
   - Progress bar (lines 854-857)
   - Adaptive recovery message (lines 675-680)
   - Capacity details message (lines 647-650)

## Expected Result

After implementation, **ALL** locations will show consistent labels:

- **"Auto"** (not "Auto (from calendar)") - "Use calendar-based capacity"
- **"Busy Day"** (not "Micro" / "Micro capacity") - "1-2 actions"
- **"Light Day"** (not "Light" / "Light capacity") - "3-4 actions"
- **"Standard"** - "5-6 actions" (consistent everywhere)
- **"Heavy Day"** (not "Heavy" / "Heavy capacity") - "7-8 actions"

All descriptions will be consistent:

- "1-2 actions" (not "1-2 actions per day")
- "3-4 actions" (not "3-4 actions per day")
- "5-6 actions" (not "5-6 actions per day")
- "7-8 actions" (not "7-8 actions per day")
