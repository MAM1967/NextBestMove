# Pin Management Quick Test Checklist

## Before You Start

1. **Ensure you're signed in**
2. **Navigate to `/app/pins`**

## Quick Smoke Tests (5 minutes)

### Basic Functionality
- [ ] Page loads with "Pinned People" title
- [ ] Filter toggle visible (All/Active/Snoozed/Archived)
- [ ] Floating action button (FAB) visible in bottom-right

### Create Pin
- [ ] Click FAB → Modal opens
- [ ] Fill name: "Test Person"
- [ ] Fill URL: "https://linkedin.com/in/test"
- [ ] Click "Save Pin" → Pin appears in list

### Filter
- [ ] Click "Active" → Only active pins show
- [ ] Click "All" → All pins show

### Edit Pin
- [ ] Click "View/Edit" on a pin → Modal opens with current values
- [ ] Change name → Click "Save Changes" → Pin updates

### Snooze
- [ ] Click "Snooze" on active pin → Modal opens
- [ ] Select date → Click "Snooze" → Pin shows "SNOOZED" status

### Archive
- [ ] Click "Archive" on active pin → Pin shows "ARCHIVED" status
- [ ] Pin appears dimmed (60% opacity)

### Restore
- [ ] Click "Restore" on archived pin → Pin becomes "ACTIVE" again

## If Everything Works ✅

- Pin management is functional
- Ready for full testing

## If Issues Found ❌

- Check browser console for errors
- Check network tab for API errors
- Verify RLS policies are set up correctly
- Check Supabase logs















