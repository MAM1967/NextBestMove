# Pin Management Smoke Test

**Component:** Pin Management UI + API  
**Date:** January 27, 2025  
**Status:** ✅ Testing Complete - All Tests Passed

---

## Quick Smoke Test Checklist

### Prerequisites

- ✅ User is signed in
- ✅ Navigate to `/app/pins`

---

## Test Cases

### TC-1: View Pins Page

**Steps:**

1. Navigate to `/app/pins`
2. Check page loads

**Expected:**

- ✅ Page title "Pinned People" displays
- ✅ Subtitle "Names you don't want to forget..." displays
- ✅ Filter toggle shows (All/Active/Snoozed/Archived)
- ✅ Floating action button (FAB) visible in bottom-right
- ✅ No errors in console

---

### TC-2: Create Pin (Happy Path)

**Steps:**

1. Click floating action button (or "Pin a Person" if empty state)
2. Fill in form:
   - Name: "Test Person"
   - URL: "https://linkedin.com/in/testperson"
   - Notes: "Met at conference" (optional)
3. Click "Save Pin"

**Expected:**

- ✅ Modal opens
- ✅ Form fields are editable
- ✅ "Save Pin" button works
- ✅ Modal closes after save
- ✅ New pin appears in list
- ✅ Pin shows as "ACTIVE" status
- ✅ Success (no error messages)

---

### TC-3: Create Pin - Email Link

**Steps:**

1. Click FAB
2. Fill in:
   - Name: "Email Contact"
   - URL: "mailto:test@example.com"
3. Click "Save Pin"

**Expected:**

- ✅ Pin created successfully
- ✅ URL type shows as "Email" in pin row

---

### TC-4: Create Pin - Validation

**Steps:**

1. Click FAB
2. Leave name empty, click "Save Pin"
3. Fill name, leave URL empty, click "Save Pin"
4. Fill invalid URL (not https://, http://, or mailto:), click "Save Pin"

**Expected:**

- ✅ Name required error shows
- ✅ URL required error shows
- ✅ Invalid URL format error shows
- ✅ Form doesn't submit with errors

---

### TC-5: Filter Pins

**Steps:**

1. Create at least 2 pins (one ACTIVE, one can be SNOOZED later)
2. Click "Active" filter
3. Click "All" filter
4. Click "Snoozed" filter (if you have snoozed pins)
5. Click "Archived" filter (if you have archived pins)

**Expected:**

- ✅ Filter buttons are clickable
- ✅ Active filter shows only ACTIVE pins
- ✅ All filter shows all pins
- ✅ Snoozed filter shows only SNOOZED pins
- ✅ Archived filter shows only ARCHIVED pins
- ✅ Filter state persists during session

---

### TC-6: Edit Pin

**Steps:**

1. Click "View/Edit" on any pin
2. Change name, URL, or notes
3. Click "Save Changes"

**Expected:**

- ✅ Edit modal opens with current values
- ✅ Changes are saved
- ✅ Pin row updates with new values
- ✅ Modal closes after save

---

### TC-7: Snooze Pin

**Steps:**

1. Click "Snooze" on an ACTIVE pin
2. Select a date (default is 7 days from now)
3. Click "Snooze"

**Expected:**

- ✅ Snooze modal opens
- ✅ Date picker shows default date (7 days from now)
- ✅ Can select future date
- ✅ Pin status changes to "SNOOZED"
- ✅ Pin shows "Snoozed until [date]" badge
- ✅ Pin appears in "Snoozed" filter

---

### TC-8: Unsnooze Pin

**Steps:**

1. Find a SNOOZED pin
2. Click "Unsnooze"

**Expected:**

- ✅ Pin status changes to "ACTIVE"
- ✅ Pin appears in "Active" filter
- ✅ Snooze date badge removed

---

### TC-9: Archive Pin

**Steps:**

1. Click "Archive" on an ACTIVE pin
2. Confirm action

**Expected:**

- ✅ Pin status changes to "ARCHIVED"
- ✅ Pin row shows reduced opacity (60%)
- ✅ Pin appears in "Archived" filter
- ✅ Only "View/Edit" and "Restore" buttons visible

---

### TC-10: Restore Pin

**Steps:**

1. Find an ARCHIVED pin
2. Click "Restore"

**Expected:**

- ✅ Pin status changes to "ACTIVE"
- ✅ Pin opacity returns to normal
- ✅ Pin appears in "Active" filter
- ✅ All action buttons visible again

---

### TC-11: Delete Pin (if implemented)

**Steps:**

1. Click delete/remove on a pin (if button exists)
2. Confirm deletion

**Expected:**

- ✅ Pin is removed from list
- ✅ Pin no longer appears in any filter

---

### TC-12: Empty State

**Steps:**

1. Archive or delete all pins (if possible)
2. View "All" filter

**Expected:**

- ✅ Empty state message displays
- ✅ "Pin a Person" button visible
- ✅ Helpful message about pinning someone

---

### TC-13: URL Type Detection

**Steps:**

1. Create pins with different URL types:
   - LinkedIn: "https://linkedin.com/in/test"
   - Email: "mailto:test@example.com"
   - Generic: "https://example.com"

**Expected:**

- ✅ LinkedIn URLs show "LinkedIn" label
- ✅ Email URLs show "Email" label
- ✅ Generic URLs show "Link" label

---

### TC-14: Notes Display

**Steps:**

1. Create a pin with notes
2. View pin in list

**Expected:**

- ✅ Notes display below pin name
- ✅ Notes are italicized
- ✅ Notes are visible in pin row

---

### TC-15: Relative Date Display

**Steps:**

1. Create a pin
2. Check "Added [time]" display

**Expected:**

- ✅ Shows "Today" for pins created today
- ✅ Shows "Yesterday" for pins created yesterday
- ✅ Shows "X days ago" for older pins
- ✅ Format is readable and helpful

---

### TC-16: Error Handling

**Steps:**

1. Disconnect internet (or block API calls)
2. Try to create/edit a pin
3. Reconnect and try again

**Expected:**

- ✅ Error message displays in modal
- ✅ Form doesn't close on error
- ✅ Can retry after reconnecting
- ✅ No crashes or broken UI

---

### TC-17: Loading States

**Steps:**

1. Create/edit a pin
2. Watch during save

**Expected:**

- ✅ Button shows "Saving..." or "Snoozing..." during operation
- ✅ Button is disabled during save
- ✅ Loading state is clear

---

### TC-18: Responsive Design

**Steps:**

1. Test on mobile viewport (< 640px)
2. Test on tablet viewport (640px - 1024px)
3. Test on desktop viewport (> 1024px)

**Expected:**

- ✅ Layout adapts to screen size
- ✅ FAB is accessible on mobile
- ✅ Modals are properly sized
- ✅ Text is readable
- ✅ Buttons are tappable (44px minimum)

---

## Quick Pass/Fail Summary

```
Test Case | Status | Notes
----------|--------|------
TC-1      | ✅      | View Pins Page
TC-2      | ✅      | Create Pin (Happy Path)
TC-3      | ✅      | Create Pin - Email Link (auto mailto: detection)
TC-4      | ✅      | Create Pin - Validation
TC-5      | ✅      | Filter Pins
TC-6      | ✅      | Edit Pin
TC-7      | ✅      | Snooze Pin
TC-8      | ✅      | Unsnooze Pin
TC-9      | ✅      | Archive Pin
TC-10     | ✅      | Restore Pin
TC-11     | N/A     | Delete Pin (not implemented - use Archive instead)
TC-12     | ✅      | Empty State
TC-13     | ✅      | URL Type Detection
TC-14     | ✅      | Notes Display
TC-15     | ✅      | Relative Date Display
TC-16     | ✅      | Error Handling
TC-17     | ✅      | Loading States
TC-18     | ✅      | Responsive Design
```

**Status Legend:**

- ✅ Pass
- ❌ Fail
- ⚠️ Partial/Issues
- ⬜ Not Tested
- N/A Not Applicable / Not Implemented

---

## Critical Path (Must Pass)

For a basic smoke test, these are the minimum tests that must pass:

1. **TC-1**: View Pins Page
2. **TC-2**: Create Pin (Happy Path)
3. **TC-5**: Filter Pins
4. **TC-6**: Edit Pin
5. **TC-7**: Snooze Pin
6. **TC-9**: Archive Pin

If all critical path tests pass, the feature is functional for basic use.

---

## Known Issues / Notes

- [ ] Document any issues found during testing
- [ ] Note any browser-specific behaviors
- [ ] Record performance observations

---

_End of Pin Management Smoke Test_
