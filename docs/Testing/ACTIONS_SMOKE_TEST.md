# Action Engine Smoke Test

**Component:** Action engine core  
**Date:** January 27, 2025  
**Status:** ✅ Testing Complete - All Tests Passed

---

## Quick Smoke Test Checklist

### Prerequisites

- ✅ User is signed in
- ✅ Navigate to `/app/actions`
- ✅ Test actions exist in database (see Setup section below)

---

## Setup: Create Test Actions

Since we don't have an action creation API yet, create test actions directly in the database:

```sql
-- Get your user_id first (replace 'your-email@example.com' with your actual email)
SELECT id, email FROM users WHERE email = 'your-email@example.com';

-- Then create test actions (replace 'YOUR_USER_ID' with the id from above)
-- Action 1: FOLLOW_UP action
INSERT INTO actions (user_id, action_type, state, description, due_date, auto_created)
VALUES (
  'YOUR_USER_ID',
  'FOLLOW_UP',
  'NEW',
  'Follow up with John about the proposal',
  CURRENT_DATE,
  false
);

-- Action 2: OUTREACH action
INSERT INTO actions (user_id, action_type, state, description, due_date, auto_created)
VALUES (
  'YOUR_USER_ID',
  'OUTREACH',
  'NEW',
  'Reach out to Sarah on LinkedIn',
  CURRENT_DATE + INTERVAL '1 day',
  false
);

-- Action 3: CONTENT action
INSERT INTO actions (user_id, action_type, state, description, due_date, auto_created)
VALUES (
  'YOUR_USER_ID',
  'CONTENT',
  'NEW',
  'Write a post about recent wins',
  CURRENT_DATE + INTERVAL '2 days',
  false
);

-- Action 4: FOLLOW_UP with person_pin (optional - create a pin first if needed)
-- First create a pin:
INSERT INTO person_pins (user_id, name, url, status)
VALUES (
  'YOUR_USER_ID',
  'Test Person',
  'https://linkedin.com/in/testperson',
  'ACTIVE'
)
RETURNING id;

-- Then create action with person_id (replace 'PIN_ID' with the returned id):
INSERT INTO actions (user_id, person_id, action_type, state, description, due_date, auto_created)
VALUES (
  'YOUR_USER_ID',
  'PIN_ID',
  'FOLLOW_UP',
  'NEW',
  'Follow up with Test Person',
  CURRENT_DATE,
  false
);
```

---

## Test Cases

### TC-1: View Actions Page

**Steps:**

1. Navigate to `/app/actions`
2. Check page loads

**Expected:**

- ✅ Page title "Actions" displays
- ✅ Subtitle "Manage your action items and follow-ups" displays
- ✅ "Refresh" button visible
- ✅ Actions list displays (if actions exist)
- ✅ Empty state shows if no actions (with helpful message)
- ✅ No errors in console

---

### TC-2: Display Actions List

**Steps:**

1. Ensure test actions exist (see Setup)
2. Navigate to `/app/actions`
3. Check action cards render

**Expected:**

- ✅ Action cards display in grid layout
- ✅ Each card shows:
  - Action type badge (e.g., "FOLLOW UP", "OUTREACH", "CONTENT")
  - Action description/title
  - Person link (if person_pin exists)
  - Action buttons based on type
- ✅ Actions sorted by due_date (ascending)
- ✅ No errors in console

---

### TC-3: Action Card - FOLLOW_UP Buttons

**Steps:**

1. Find a FOLLOW_UP action card
2. Check buttons displayed

**Expected:**

- ✅ "Done - Got reply" button (primary style)
- ✅ "Done - No reply yet" button (secondary style)
- ✅ "Snooze" button (ghost style)
- ✅ "Add note" button (ghost style)
- ✅ Buttons are clickable

---

### TC-4: Action Card - CONTENT Buttons

**Steps:**

1. Find a CONTENT action card
2. Check buttons displayed

**Expected:**

- ✅ "Done" button (primary style)
- ✅ "Snooze" button (ghost style)
- ✅ "View prompt" button (ghost style)
- ✅ Buttons are clickable

---

### TC-5: Action Card - Default Buttons (OUTREACH, etc.)

**Steps:**

1. Find an OUTREACH or other non-FOLLOW_UP action card
2. Check buttons displayed

**Expected:**

- ✅ "Done" button (primary style)
- ✅ "Snooze" button (ghost style)
- ✅ "Add note" button (ghost style)
- ✅ Buttons are clickable

---

### TC-6: Action Card - Person Link

**Steps:**

1. Find an action with a person_pin
2. Check person link displays

**Expected:**

- ✅ Person link displays (e.g., "LinkedIn", "Email", "Link")
- ✅ Link is clickable
- ✅ Link opens in new tab
- ✅ Link URL matches person_pin.url

---

### TC-7: Action Card - Notes Display

**Steps:**

1. Create an action with notes (via SQL):
   ```sql
   UPDATE actions SET notes = 'Test note about this action' WHERE id = 'ACTION_ID';
   ```
2. Refresh `/app/actions`
3. Check action card

**Expected:**

- ✅ Notes icon displays
- ✅ Note text displays below description
- ✅ Note text is italicized

---

### TC-8: Complete Action - "Done" (Simple)

**Steps:**

1. Find an action (not FOLLOW_UP)
2. Click "Done" button
3. Refresh page

**Expected:**

- ✅ Action state changes to "DONE"
- ✅ Action disappears from list (or shows as DONE if filtered)
- ✅ No error messages
- ✅ `completed_at` timestamp is set in database

**Database Verification:**

```sql
SELECT id, state, completed_at FROM actions WHERE id = 'ACTION_ID';
-- Should show: state = 'DONE', completed_at is not null
```

---

### TC-9: Complete Action - "Done - No reply yet" (FOLLOW_UP)

**Steps:**

1. Find a FOLLOW_UP action
2. Click "Done - No reply yet" button
3. Refresh page

**Expected:**

- ✅ Action state changes to "SENT"
- ✅ Action disappears from list (or shows as SENT if filtered)
- ✅ No error messages
- ✅ `completed_at` timestamp is set in database

**Database Verification:**

```sql
SELECT id, state, completed_at FROM actions WHERE id = 'ACTION_ID';
-- Should show: state = 'SENT', completed_at is not null
```

---

### TC-10: Follow-Up Flow - "Got reply" Button

**Steps:**

1. Find a FOLLOW_UP action
2. Click "Done - Got reply" button

**Expected:**

- ✅ FollowUpFlowModal opens
- ✅ Modal title: "Got a reply — what's next?"
- ✅ Three options display:
  - "Schedule follow-up" (with "Recommended" badge)
  - "Snooze"
  - "Mark complete"
- ✅ "Add note about this reply" link at bottom
- ✅ Modal can be closed (X button or click outside)

---

### TC-11: Follow-Up Flow - Schedule Follow-Up

**Steps:**

1. Complete TC-10
2. Click "Schedule follow-up" option
3. FollowUpSchedulingModal should open
4. Check default date
5. Change date to 5 days from now
6. Add optional note: "They want to discuss pricing"
7. Click "Schedule Follow-Up"

**Expected:**

- ✅ FollowUpSchedulingModal opens
- ✅ Default date is 3 days from today
- ✅ Date picker works
- ✅ Note field is optional
- ✅ "Schedule Follow-Up" button works
- ✅ Modal closes after submit
- ✅ Original action state changes to "REPLIED"
- ✅ Note is saved (if provided)
- ✅ No error messages

**Database Verification:**

```sql
SELECT id, state, notes, completed_at FROM actions WHERE id = 'ACTION_ID';
-- Should show: state = 'REPLIED', notes contains the note (if provided), completed_at is not null
```

**Note:** Creating the new FOLLOW_UP action is not yet implemented (TODO), so only the current action is updated.

---

### TC-12: Follow-Up Flow - Snooze from Modal

**Steps:**

1. Complete TC-10
2. Click "Snooze" option
3. SnoozeActionModal should open
4. Check default date
5. Change date to 10 days from now
6. Click "Snooze"

**Expected:**

- ✅ SnoozeActionModal opens
- ✅ Default date is 7 days from today
- ✅ Date picker works
- ✅ "Snooze" button works
- ✅ Modal closes after submit
- ✅ Action state changes to "SNOOZED"
- ✅ `snooze_until` is set in database
- ✅ No error messages

**Database Verification:**

```sql
SELECT id, state, snooze_until FROM actions WHERE id = 'ACTION_ID';
-- Should show: state = 'SNOOZED', snooze_until is set to selected date
```

---

### TC-13: Follow-Up Flow - Mark Complete from Modal

**Steps:**

1. Complete TC-10
2. Click "Mark complete" option

**Expected:**

- ✅ Modal closes immediately
- ✅ Action state changes to "DONE"
- ✅ `completed_at` timestamp is set
- ✅ No error messages

**Database Verification:**

```sql
SELECT id, state, completed_at FROM actions WHERE id = 'ACTION_ID';
-- Should show: state = 'DONE', completed_at is not null
```

---

### TC-14: Follow-Up Flow - Add Note from Modal

**Steps:**

1. Complete TC-10
2. Click "Add note about this reply" link
3. ActionNoteModal should open
4. Enter note: "They responded positively, want to schedule a call"
5. Click "Save Note"

**Expected:**

- ✅ ActionNoteModal opens
- ✅ Note field is editable
- ✅ "Save Note" button works
- ✅ Modal closes after save
- ✅ Note is saved to action
- ✅ Action card updates to show note

**Database Verification:**

```sql
SELECT id, notes FROM actions WHERE id = 'ACTION_ID';
-- Should show: notes contains the saved note
```

---

### TC-15: Snooze Action - Direct

**Steps:**

1. Find any action (not already SNOOZED)
2. Click "Snooze" button
3. SnoozeActionModal opens
4. Check default date (should be 7 days)
5. Change date to 14 days from now
6. Click "Snooze"

**Expected:**

- ✅ SnoozeActionModal opens
- ✅ Default date is 7 days from today
- ✅ Date picker works
- ✅ "Snooze" button works
- ✅ Modal closes after submit
- ✅ Action state changes to "SNOOZED"
- ✅ `snooze_until` is set to selected date
- ✅ No error messages

**Database Verification:**

```sql
SELECT id, state, snooze_until FROM actions WHERE id = 'ACTION_ID';
-- Should show: state = 'SNOOZED', snooze_until = selected date
```

---

### TC-16: Add Note - Direct

**Steps:**

1. Find any action
2. Click "Add note" button
3. ActionNoteModal opens
4. Enter note: "Important: Check their calendar availability"
5. Click "Save Note"

**Expected:**

- ✅ ActionNoteModal opens
- ✅ Note field is empty (or shows existing note if updating)
- ✅ "Save Note" button works
- ✅ Modal closes after save
- ✅ Note is saved to action
- ✅ Action card updates to show note with icon

**Database Verification:**

```sql
SELECT id, notes FROM actions WHERE id = 'ACTION_ID';
-- Should show: notes contains the saved note
```

---

### TC-17: Update Existing Note

**Steps:**

1. Complete TC-16 (action has a note)
2. Click "Add note" button again
3. ActionNoteModal opens with existing note
4. Modify note: "Important: Check their calendar availability - Updated: They prefer mornings"
5. Click "Save Note"

**Expected:**

- ✅ Modal opens with existing note pre-filled
- ✅ Note can be edited
- ✅ "Save Note" button works
- ✅ Modal closes after save
- ✅ Note is updated in database
- ✅ Action card shows updated note

**Database Verification:**

```sql
SELECT id, notes FROM actions WHERE id = 'ACTION_ID';
-- Should show: notes contains the updated note
```

---

### TC-18: API - List Actions with Filters

**Steps:**

1. Open browser DevTools → Network tab
2. Navigate to `/app/actions`
3. Check API request to `/api/actions`
4. Try filtering by state (if filter UI exists, or manually):
   - `GET /api/actions?state=NEW`
   - `GET /api/actions?state=SNOOZED`
   - `GET /api/actions?state=DONE`

**Expected:**

- ✅ API returns 200 status
- ✅ Response contains `actions` array
- ✅ Filtering by state works correctly
- ✅ Only actions matching filter are returned
- ✅ Actions include `person_pins` relation when present

---

### TC-19: API - Update Action State

**Steps:**

1. Open browser DevTools → Network tab
2. Complete an action (TC-8 or TC-9)
3. Check API request to `/api/actions/[id]/state`

**Expected:**

- ✅ PATCH request sent to `/api/actions/[id]/state`
- ✅ Request body contains `{ state: "DONE" }` or `{ state: "SENT" }`
- ✅ API returns 200 status
- ✅ Response contains updated `action` object
- ✅ `completed_at` is set in response

---

### TC-20: API - Snooze Action

**Steps:**

1. Open browser DevTools → Network tab
2. Snooze an action (TC-15)
3. Check API request to `/api/actions/[id]/snooze`

**Expected:**

- ✅ PATCH request sent to `/api/actions/[id]/snooze`
- ✅ Request body contains `{ snooze_until: "YYYY-MM-DD" }`
- ✅ API returns 200 status
- ✅ Response contains updated `action` object
- ✅ `state` is "SNOOZED" in response
- ✅ `snooze_until` matches request date

---

### TC-21: API - Add/Update Note

**Steps:**

1. Open browser DevTools → Network tab
2. Add a note to an action (TC-16)
3. Check API request to `/api/actions/[id]/notes`

**Expected:**

- ✅ POST request sent to `/api/actions/[id]/notes`
- ✅ Request body contains `{ note: "..." }`
- ✅ API returns 200 status
- ✅ Response contains updated `action` object
- ✅ `notes` field matches request note

---

### TC-22: Error Handling - Invalid State

**Steps:**

1. Open browser DevTools → Console tab
2. Manually call API with invalid state:
   ```javascript
   fetch("/api/actions/ACTION_ID/state", {
     method: "PATCH",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ state: "INVALID" }),
   })
     .then((r) => r.json())
     .then(console.log);
   ```

**Expected:**

- ✅ API returns 400 status
- ✅ Error message: "Invalid state. Must be one of: NEW, SENT, REPLIED, SNOOZED, DONE, ARCHIVED"
- ✅ No state change in database

---

### TC-23: Error Handling - Snooze Date in Past

**Steps:**

1. Open SnoozeActionModal
2. Try to set snooze date to yesterday
3. Submit form

**Expected:**

- ✅ Date picker prevents selecting past dates (min attribute)
- ✅ If somehow submitted, API returns 400
- ✅ Error message: "Snooze date must be today or in the future"
- ✅ No state change in database

---

### TC-24: Error Handling - Unauthorized Access

**Steps:**

1. Sign out
2. Try to access `/app/actions`
3. Check redirect

**Expected:**

- ✅ Redirected to `/auth/sign-in`
- ✅ `redirect` query param includes `/app/actions`
- ✅ After sign-in, redirects back to `/app/actions`

---

### TC-25: Empty State

**Steps:**

1. Delete all actions for your user (via SQL):
   ```sql
   DELETE FROM actions WHERE user_id = 'YOUR_USER_ID';
   ```
2. Navigate to `/app/actions`
3. Check empty state

**Expected:**

- ✅ Empty state message displays
- ✅ Message: "No actions found."
- ✅ Subtitle: "Actions will appear here when you have tasks to complete."
- ✅ No errors in console

---

## Test Results Summary

| Test Case                              | Status    | Notes                               |
| -------------------------------------- | --------- | ----------------------------------- |
| TC-1: View Actions Page                | ✅ PASSED |                                     |
| TC-2: Display Actions List             | ✅ PASSED | Due dates now displayed             |
| TC-3: Action Card - FOLLOW_UP Buttons  | ✅ PASSED |                                     |
| TC-4: Action Card - CONTENT Buttons    | ✅ PASSED | View prompt button now opens modal  |
| TC-5: Action Card - Default Buttons    | ✅ PASSED |                                     |
| TC-6: Action Card - Person Link        | ✅ PASSED |                                     |
| TC-7: Action Card - Notes Display      | ✅ PASSED |                                     |
| TC-8: Complete Action - "Done"         | ✅ PASSED |                                     |
| TC-9: Complete Action - "No reply yet" | ✅ PASSED | State badge now more visible        |
| TC-10: Follow-Up Flow - "Got reply"    | ✅ PASSED |                                     |
| TC-11: Follow-Up Flow - Schedule       | ✅ PASSED | Scheduled date now included in note |
| TC-12: Follow-Up Flow - Snooze         | ✅ PASSED |                                     |
| TC-13: Follow-Up Flow - Mark Complete  | ✅ PASSED |                                     |
| TC-14: Follow-Up Flow - Add Note       | ✅ PASSED |                                     |
| TC-15: Snooze Action - Direct          | ✅ PASSED |                                     |
| TC-16: Add Note - Direct               | ✅ PASSED |                                     |
| TC-17: Update Existing Note            | ✅ PASSED |                                     |
| TC-18: API - List Actions              | ✅ PASSED |                                     |
| TC-19: API - Update State              | ✅ PASSED |                                     |
| TC-20: API - Snooze                    | ✅ PASSED |                                     |
| TC-21: API - Add/Update Note           | ✅ PASSED |                                     |
| TC-22: Error Handling - Invalid State  | ✅ PASSED |                                     |
| TC-23: Error Handling - Past Date      | ✅ PASSED |                                     |
| TC-24: Error Handling - Unauthorized   | ✅ PASSED |                                     |
| TC-25: Empty State                     | ✅ PASSED |                                     |

---

## Notes

- Action creation API is not yet implemented, so test actions must be created via SQL
- Follow-up scheduling creates a new FOLLOW_UP action (TODO) - currently only marks original as REPLIED
- All modals should handle loading states and errors gracefully
- API routes enforce RLS - users can only access their own actions
