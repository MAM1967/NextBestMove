# Critical Tests - Must Pass Before Launch

These tests verify core functionality that directly impacts user trust and billing reliability.

---

## Test 1: Calendar Import & Availability Calculation Visibility

### Purpose

Verify that calendar events are imported correctly and that daily capacity calculations are transparent and accurate.

### Test Steps

1. **Connect Calendar**

   - Go to Settings → Calendar section
   - Connect Google Calendar or Outlook
   - Verify connection status shows "Connected"

2. **Verify Calendar Events Import**

   - After connection, the system should display:
     - **All calendar events for the current user** (for the next 7 days)
     - Event titles, times, and durations
     - Which calendar(s) are being used
   - This can be shown in:
     - Settings page (Calendar section)
     - A debug/info panel
     - Console logs (for development)
     - Or a dedicated "View Calendar" page

3. **Verify Availability Calculation**
   - For each day (today + next 6 days), the system should show:
     - **Total hours in day:** 24 hours
     - **Busy hours:** Sum of all calendar events
     - **Available hours:** 24 - busy hours
     - **Calculated capacity:** How many actions can fit in available time
     - **Breakdown by time blocks:** Show which hours are free/busy
4. **Verify Daily Plan Generation Uses Calendar**

   - Generate a daily plan
   - The plan should show:
     - **Calendar-based capacity badge** (already implemented)
     - Number of actions that fit in available time
     - Actions should NOT exceed available capacity
   - Compare:
     - Plan capacity vs. calculated available hours
     - Number of actions in plan vs. capacity
     - Should match or be less than capacity

5. **Test Edge Cases**
   - **Fully booked day:** Calendar has events from 8am-6pm
     - Expected: Very low or zero capacity
     - Plan should reflect this
   - **Empty calendar:** No events
     - Expected: Full capacity (default)
     - Plan should use default capacity
   - **Partial day:** Events from 10am-2pm only
     - Expected: Capacity for morning + evening
     - Plan should show appropriate number of actions

### Expected Output Format

When calendar is connected, user should see something like:

```
Calendar Status: Connected (Google Calendar)
Last Sync: 2025-11-27 14:30

Upcoming Events (Next 7 Days):
- Today (Nov 27):
  * 9:00 AM - 10:00 AM: Team Standup
  * 2:00 PM - 3:00 PM: Client Call
  * 4:00 PM - 5:00 PM: Review Meeting
  Total Busy: 3 hours
  Available: 13 hours (assuming 8-hour work day)
  Calculated Capacity: 6 actions

- Tomorrow (Nov 28):
  * 10:00 AM - 12:00 PM: Workshop
  * 1:00 PM - 2:00 PM: Lunch Meeting
  Total Busy: 3 hours
  Available: 5 hours
  Calculated Capacity: 4 actions
```

### Acceptance Criteria

- [ ] Calendar events are visible after connection
- [ ] Events are correctly parsed (title, time, duration)
- [ ] Availability calculation is shown for each day
- [ ] Daily plan capacity matches calculated availability
- [ ] Plan generation respects calendar capacity
- [ ] Edge cases (full day, empty, partial) work correctly

### Implementation Notes

This test requires:

1. **Calendar events display** - Show imported events in UI
2. **Availability breakdown** - Show free/busy calculation
3. **Capacity transparency** - Show how capacity is calculated
4. **Plan verification** - Verify plan respects capacity

**Location for display:**

- Settings → Calendar section (add "View Calendar" button)
- Or dedicated debug/info panel
- Or console logs with detailed breakdown

---

## Test 2: Stripe Checkout Flow Resilience

### Purpose

Verify that the billing flow is robust and handles user navigation (back button, cancel) gracefully without breaking the UI state.

### Test Steps

1. **Initial State**

   - User has no subscription
   - Settings page shows "Start Free Trial" button
   - Button is visible and clickable

2. **Open Plan Selection Modal**

   - Click "Start Free Trial" button
   - Modal opens with plan selection
   - "Start Free Trial" button on Settings page disappears (current behavior)

3. **Test Cancel Button**

   - Click "Cancel" button in modal
   - Modal closes
   - **Expected:** "Start Free Trial" button should reappear on Settings page
   - **Current Bug:** Button does NOT reappear

4. **Test Browser Back Button**

   - Open plan selection modal
   - Press browser back button
   - Modal should close (or stay open, depending on implementation)
   - **Expected:** "Start Free Trial" button should still be available
   - **Current Bug:** Button disappears and doesn't come back

5. **Test Multiple Cancel/Open Cycles**

   - Open modal → Cancel → Button reappears
   - Open modal → Cancel → Button reappears
   - Repeat 3-5 times
   - **Expected:** Button should always reappear after cancel

6. **Test Successful Checkout**

   - Open modal → Select plan → Click "Start Free Trial"
   - Redirects to Stripe
   - Complete checkout
   - **Expected:** Button should NOT reappear (subscription created)
   - User should see subscription status instead

7. **Test Stripe Cancel**
   - Open modal → Select plan → Click "Start Free Trial"
   - Redirects to Stripe
   - Click "Cancel" on Stripe checkout page
   - Returns to Settings page
   - **Expected:** "Start Free Trial" button should reappear
   - User should be able to try again

### Expected Behavior

**State Management:**

- Modal open/close should NOT affect parent component state
- Button visibility should be based on subscription status, not modal state
- Cancel should reset to initial state (no subscription = show button)

**User Experience:**

- User can cancel and try again without issues
- Browser navigation doesn't break the flow
- Stripe checkout cancellation returns user to working state

### Acceptance Criteria

- [ ] "Start Free Trial" button reappears after canceling modal
- [ ] Browser back button doesn't break button visibility
- [ ] Multiple cancel/open cycles work correctly
- [ ] Successful checkout hides button (correct behavior)
- [ ] Stripe checkout cancellation returns to working state
- [ ] Button state is based on subscription status, not modal state

### Bug Fix Required

**Issue:** `BillingSection` component uses `showPlanSelection` state to hide/show the "Start Free Trial" button, but this state doesn't reset when modal is closed via cancel.

**Fix:** Button visibility should be based on `hasCustomer && !subscription`, not on modal state. Modal state should only control modal visibility.

---

## Test Execution Priority

These tests should be run:

1. **Before any production deployment**
2. **After any calendar integration changes**
3. **After any billing/Stripe changes**
4. **As part of weekly regression testing**

---

## Test Results Template

```
Date: [DATE]
Tester: [NAME]
Environment: [LOCAL/PRODUCTION]

### Test 1: Calendar Import & Availability
- [ ] Calendar events visible: PASS/FAIL
- [ ] Availability calculation shown: PASS/FAIL
- [ ] Plan respects capacity: PASS/FAIL
- [ ] Edge cases work: PASS/FAIL
- Notes: [ANY ISSUES]

### Test 2: Stripe Checkout Resilience
- [ ] Cancel button works: PASS/FAIL
- [ ] Back button works: PASS/FAIL
- [ ] Multiple cycles work: PASS/FAIL
- [ ] Stripe cancel works: PASS/FAIL
- Notes: [ANY ISSUES]
```

---

_These tests are critical for user trust and billing reliability. Do not skip._


